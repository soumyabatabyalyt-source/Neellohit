import { NextResponse } from "next/server"
import { createUserClient } from "@/lib/taskLifecycle"

type SubmissionRow = {
  id: string
  claim_id: string
  user_id: string
  task_id: string
  status: "pending" | "approved" | "rejected"
  submission_link: string | null
  created_at: string | null
}

export async function GET(req: Request) {
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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) throw profileError

    if (profile?.role !== "admin" && profile?.role !== "manager") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { data: submissionRows, error: submissionsError } = await supabase
      .from("task_submissions")
      .select("id, claim_id, user_id, task_id, status, submission_link, created_at")
      .in("status", ["pending", "approved", "rejected"])
      .order("created_at", { ascending: false })

    if (submissionsError) throw submissionsError

    const typedClaims = (submissionRows || []) as SubmissionRow[]
    const userIds = [...new Set(typedClaims.map((claim) => claim.user_id))]
    const taskIds = [...new Set(typedClaims.map((claim) => claim.task_id))]

    const { data: profiles } = userIds.length
      ? await supabase
          .from("profiles")
          .select("id, email, reddit")
          .in("id", userIds)
      : { data: [] }

    const { data: tasks } = taskIds.length
      ? await supabase
          .from("tasks")
          .select("id, title, reward, task_code, task_type, comment_type, subreddit, post_link")
          .in("id", taskIds)
      : { data: [] }

    const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]))
    const taskById = new Map((tasks || []).map((task) => [task.id, task]))

    const submissions = typedClaims.map((claim) => ({
      ...claim,
      profile: profileById.get(claim.user_id) || null,
      task: taskById.get(claim.task_id) || null,
    }))

    return NextResponse.json({ submissions })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load submissions"
    console.error("Manager submissions error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
