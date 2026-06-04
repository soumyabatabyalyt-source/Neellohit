/**
 * Debug endpoint to check submission status and sheet sync
 * GET /api/debug-submission?task_code=A200001
 */

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/taskLifecycle"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const taskCode = url.searchParams.get("task_code")

    if (!taskCode) {
      return NextResponse.json({
        error: "Missing query param: task_code",
        example: "/api/debug-submission?task_code=A200001"
      }, { status: 400 })
    }

    const supabase = createAdminClient()

    // ─────────────────────────────────────────────────────────
    // FETCH TASK FROM DATABASE
    // ─────────────────────────────────────────────────────────

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("task_code", taskCode)
      .single()

    if (taskError || !task) {
      return NextResponse.json({
        error: "Task not found",
        task_code: taskCode,
        details: taskError?.message
      }, { status: 404 })
    }

    // ─────────────────────────────────────────────────────────
    // FETCH SUBMISSIONS FOR THIS TASK
    // ─────────────────────────────────────────────────────────

    const { data: submissions } = await supabase
      .from("task_submissions")
      .select("*")
      .eq("task_id", task.id)

    // ─────────────────────────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────────────────────────

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        task_code: task.task_code,
        task_type: task.task_type,
        title: task.title,
        status: task.status,
        post_link: task.post_link,
        comment_link: task.comment_link,
        created_at: task.created_at,
      },
      submissions: submissions?.map(s => ({
        id: s.id,
        user_id: s.user_id,
        submission_link: s.submission_link,
        status: s.status,
        created_at: s.created_at,
      })) || [],
      diagnostics: {
        has_post_link: !!task.post_link,
        has_comment_link: !!task.comment_link,
        submission_count: submissions?.length || 0,
        is_pending_review: task.status === "pending_review",
        message: task.post_link || task.comment_link
          ? "✅ Link is stored in database"
          : "❌ No link found in database - check if submission was saved"
      }
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Debug failed"
    console.error("Debug endpoint error:", error)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
