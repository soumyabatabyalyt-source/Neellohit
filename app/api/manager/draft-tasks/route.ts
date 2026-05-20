import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =========================================
// GET DRAFT TASKS
// =========================================

export async function GET(req: Request) {
  try {
    const token = req.headers
      .get("authorization")
      ?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Create user client
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    // Verify manager
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      )
    }

    const { data: profile } =
      await userClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

    if (
      profile?.role !== "admin" &&
      profile?.role !== "manager"
    ) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    // Fetch draft tasks
    const { data: tasks, error } =
      await supabase
        .from("tasks")
        .select("*")
        .eq("draft", true)
        .order(
          "created_at",
          { ascending: false }
        )

    if (error) {
      throw error
    }

    return NextResponse.json({
      tasks: tasks || [],
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load draft tasks"

    console.error(
      "Draft tasks error:",
      error
    )

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// =========================================
// UPDATE DRAFT TASK
// =========================================

export async function PUT(req: Request) {
  try {
    const token = req.headers
      .get("authorization")
      ?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify manager
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      )
    }

    const { data: profile } =
      await userClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

    if (
      profile?.role !== "admin" &&
      profile?.role !== "manager"
    ) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    const {
      taskId,
      action,
      taskData,
      rejectionReason,
    } = await req.json()

    if (!taskId || !action) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      )
    }

    // =====================================
    // PUBLISH DRAFT
    // =====================================

    if (action === "publish") {
      const { error } = await supabase
        .from("tasks")
        .update({
          draft: false,
          approval_status:
            "approved",
        })
        .eq("id", taskId)

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        message:
          "Task published to pool",
      })
    }

    // =====================================
    // REJECT DRAFT
    // =====================================

    if (action === "reject") {
      const { error } = await supabase
        .from("tasks")
        .update({
          draft: false,
          approval_status:
            "rejected",
          rejection_reason:
            rejectionReason ||
            "Rejected by manager",
        })
        .eq("id", taskId)

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        message: "Task rejected",
      })
    }

    // =====================================
    // EDIT DRAFT
    // =====================================

    if (action === "edit") {
      if (!taskData) {
        return NextResponse.json(
          { error: "Missing taskData" },
          { status: 400 }
        )
      }

      const { error } = await supabase
        .from("tasks")
        .update(taskData)
        .eq("id", taskId)

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        message: "Task updated",
      })
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update task"

    console.error(
      "Draft task update error:",
      error
    )

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
