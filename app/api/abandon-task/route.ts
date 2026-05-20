import { NextResponse } from "next/server"
import {
  createUserClient,
  findTaskByClaimTaskId,
  getTaskPrimaryId,
  type TaskClaim,
} from "@/lib/taskLifecycle"

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createUserClient(token)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const { claim_id } = await req.json()
    if (!claim_id) {
      return NextResponse.json({ error: "Missing claim_id" }, { status: 400 })
    }

    const { data: claim, error: claimError } = await supabase
      .from("task_claims")
      .select("*")
      .eq("id", claim_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (claimError) throw claimError

    if (!claim) {
      return NextResponse.json({ error: "Active claim not found" }, { status: 404 })
    }

    const { error: updateClaimError } = await supabase
      .from("task_claims")
      .update({ status: "released" })
      .eq("id", claim.id)
      .eq("status", "active")

    if (updateClaimError) throw updateClaimError

    const task = await findTaskByClaimTaskId(supabase, (claim as TaskClaim).task_id)
    if (task) {
      const { error: reopenError } = await supabase
        .from("tasks")
        .update({
          status: "open",
        })
        .eq("id", getTaskPrimaryId(task, (claim as TaskClaim).task_id))

      if (reopenError) throw reopenError
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not reject task"
    console.error("Abandon task error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
