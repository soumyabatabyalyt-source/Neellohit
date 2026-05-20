import { NextResponse } from "next/server"
import {
  createUserClient,
  createAdminClient,
  findTaskByClaimTaskId,
  getTaskPrimaryId,
} from "@/lib/taskLifecycle"

type ReviewAction = "approved" | "rejected"

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use user client only for auth verification
    const userSupabase = createUserClient(token)
    const {
      data: { user },
      error: authError,
    } = await userSupabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid user" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await userSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) throw profileError

    if (profile?.role !== "admin" && profile?.role !== "manager") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { claim_id, action, rejectionReason } = await req.json()
    if (!claim_id) {
      return NextResponse.json({ error: "Missing claim_id" }, { status: 400 })
    }
    if (action !== "approved" && action !== "rejected") {
      return NextResponse.json({ error: "Invalid review action" }, { status: 400 })
    }

    // Use admin client for all database operations to bypass RLS
    const supabase = createAdminClient()

    // Get the submission (claim_id is actually the task_claims ID, not submission ID)
    const { data: taskClaim, error: claimError } = await supabase
      .from("task_claims")
      .select("*")
      .eq("id", claim_id)
      .eq("status", "submitted")
      .maybeSingle()

    if (claimError) throw claimError

    if (!taskClaim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    // Get the submission from task_submissions
    const { data: submission, error: submissionError } = await supabase
      .from("task_submissions")
      .select("*")
      .eq("claim_id", claim_id)
      .eq("status", "pending")
      .maybeSingle()

    if (submissionError) throw submissionError

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const task = await findTaskByClaimTaskId(supabase, taskClaim.task_id)
    const rewardCredits = Number((task as any)?.reward_credits || 0)
    const reviewedStatus = action as ReviewAction

    // Update task_submissions status
    const { data: reviewedSubmission, error: updateSubmissionError } = await supabase
      .from("task_submissions")
      .update({ status: reviewedStatus })
      .eq("id", submission.id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle()

    if (updateSubmissionError) throw updateSubmissionError

    if (!reviewedSubmission) {
      return NextResponse.json(
        { error: "Submission was already reviewed" },
        { status: 409 }
      )
    }

    // Update task_claims status — "completed" for approved, keep enum-valid value for rejected
    const claimFinalStatus = reviewedStatus === "approved" ? "completed" : "expired"
    await supabase
      .from("task_claims")
      .update({ status: claimFinalStatus })
      .eq("id", claim_id)

    if (reviewedStatus === "approved" && rewardCredits > 0) {
      try {
        const { data: wallet, error: walletError } = await supabase
          .from("wallets")
          .select("id, balance_credits")
          .eq("user_id", taskClaim.user_id)
          .maybeSingle()

        if (walletError) throw walletError

        if (!wallet) {
          const { error } = await supabase.from("wallets").insert({
            user_id: taskClaim.user_id,
            balance_credits: rewardCredits,
          })
          if (error) throw error
        } else {
          const { error } = await supabase
            .from("wallets")
            .update({ balance_credits: Number(wallet.balance_credits || 0) + rewardCredits })
            .eq("user_id", taskClaim.user_id)

          if (error) throw error
        }
      } catch (creditError) {
        await supabase
          .from("task_submissions")
          .update({ status: "pending" })
          .eq("id", submission.id)
        throw creditError
      }
    }

    if (task) {
      // tasks.status enum: draft/open/available/claimed/pending_review/completed/expired/rejected
      const taskFinalStatus = reviewedStatus === "approved" ? "completed" : "rejected"
      const taskUpdate: any = {
        status: taskFinalStatus,
        approval_status: reviewedStatus,
      }

      // Add rejection reason if rejected
      if (reviewedStatus === "rejected" && rejectionReason) {
        taskUpdate.rejection_reason = rejectionReason
      }

      await supabase
        .from("tasks")
        .update(taskUpdate)
        .eq("id", getTaskPrimaryId(task, taskClaim.task_id))
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Review failed"
    console.error("Review task error:", error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
