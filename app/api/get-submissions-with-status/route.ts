/**
 * Get all task submissions with link status validation
 * Returns JSON with task submissions and whether links are live/valid
 *
 * GET /api/get-submissions-with-status
 * Query params:
 *   - task_type: "post" | "comment" (optional filter)
 *   - status: "pending" | "approved" | "rejected" (optional filter)
 *   - validate_links: "true" | "false" (check if links are live, default true)
 */

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/taskLifecycle"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const taskType = url.searchParams.get("task_type")
    const status = url.searchParams.get("status")
    const validateLinks = url.searchParams.get("validate_links") !== "false"

    const supabase = createAdminClient()

    // ─────────────────────────────────────────────────────────
    // FETCH SUBMISSIONS WITH TASK & CLAIM DATA
    // ─────────────────────────────────────────────────────────

    let query = supabase
      .from("task_submissions")
      .select(`
        id,
        task_id,
        user_id,
        submission_link,
        status,
        created_at,
        tasks (
          id,
          task_code,
          task_type,
          title,
          body,
          reward,
          subreddit,
          post_link,
          comment_link
        ),
        profiles (
          email,
          username
        )
      `)

    // Apply filters
    if (taskType) {
      query = query.eq("tasks.task_type", taskType)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data: submissions, error } = await query.order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch submissions: ${error.message}`)
    }

    // ─────────────────────────────────────────────────────────
    // VALIDATE LINKS (CHECK IF LIVE)
    // ─────────────────────────────────────────────────────────

    const validatedSubmissions = await Promise.all(
      (submissions || []).map(async (submission: any) => {
        let linkStatus = "unknown"
        let linkStatusCode: number | null = null

        if (validateLinks && submission.submission_link) {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)
            const response = await fetch(submission.submission_link, {
              method: "HEAD",
              redirect: "follow",
              signal: controller.signal,
            })
            clearTimeout(timeoutId)

            linkStatusCode = response.status
            linkStatus = response.ok ? "live" : `error_${response.status}`
          } catch (linkError) {
            linkStatus = "unreachable"
          }
        }

        return {
          id: submission.id,
          task_code: submission.tasks?.task_code,
          task_type: submission.tasks?.task_type,
          task_title: submission.tasks?.title,
          task_reward: submission.tasks?.reward,
          submitted_by: submission.profiles?.username || submission.profiles?.email,
          submission_link: submission.submission_link,
          link_status: linkStatus,
          link_status_code: linkStatusCode,
          submission_status: submission.status,
          submitted_at: submission.created_at,
        }
      })
    )

    // ─────────────────────────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────────────────────────

    return NextResponse.json({
      success: true,
      count: validatedSubmissions.length,
      submissions: validatedSubmissions,
      filters: {
        task_type: taskType,
        status: status,
        validate_links: validateLinks,
      },
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch submissions"

    console.error("Get submissions error:", error)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
