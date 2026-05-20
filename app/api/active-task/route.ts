import { createUserClient } from "@/lib/taskLifecycle"

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createUserClient(token)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Invalid session" }, { status: 401 })
    }

    const user_id = user.id

    const { data: claim, error } = await supabase
      .from("task_claims")
      .select(`
        id,
        task_id,
        status,
        created_at,
        expires_at
      `)
      .eq("user_id", user_id)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("DB ERROR:", error)
      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!claim) {
      return Response.json({
        claim: null,
        task: null,
        server_now: new Date().toISOString(),
      })
    }

    // FETCH ASSOCIATED TASK
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, title, description, reward")
      .eq("id", claim.task_id)
      .maybeSingle()

    if (taskError) {
      console.error("Task fetch error:", taskError)
    }

    return Response.json({
      claim: {
        id: claim.id,
        task_id: claim.task_id,
        created_at: claim.created_at,
        expires_at: claim.expires_at,
      },
      task: task || null,
      server_now: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error("SERVER ERROR:", err)
    return Response.json(
      { error: err?.message || "Server failed" },
      { status: 500 }
    )
  }
}