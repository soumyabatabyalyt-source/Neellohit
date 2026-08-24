import { NextResponse } from "next/server"

import { createUserClient } from "@/lib/taskLifecycle"
import { isTopLevelTaskType } from "@/lib/platforms"


// =========================================
// POST
// =========================================

export async function POST(
  req: Request
) {

  try {

    // =====================================
    // AUTH HEADER
    // =====================================

    const authHeader =
      req.headers.get(
        "authorization"
      )

    if (!authHeader) {

      return NextResponse.json(
        {
          error:
            "No auth header",
        },
        {
          status: 401,
        }
      )
    }

    const token =
      authHeader.replace(
        "Bearer ",
        ""
      )

    // =====================================
    // GET USER
    // =====================================

    const supabase = createUserClient(token)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (
      userError ||
      !user
    ) {

      console.error(
        "AUTH ERROR:",
        userError
      )

      return NextResponse.json(
        {
          error:
            "Invalid user",
        },
        {
          status: 401,
        }
      )
    }

    // =====================================
    // BODY
    // =====================================

    const body =
      await req.json()

    const {
      claim_id,
      submission_link,
    } = body

    if (
      !claim_id ||
      !submission_link
    ) {

      return NextResponse.json(
        {
          error:
            "Missing data",
        },
        {
          status: 400,
        }
      )
    }

    // =====================================
    // RAW SUBMISSION LINK (trimmed only)
    // =====================================

    const rawSubmission = submission_link.trim()

    // =====================================
    // FIND CLAIM
    // =====================================

    const {
      data: claim,
      error: claimError,
    } = await supabase
      .from("task_claims")
      .select("*")
      .eq("id", claim_id)
      .eq("user_id", user.id)
      .single()

    if (
      claimError ||
      !claim
    ) {

      console.error(
        "CLAIM ERROR:",
        claimError
      )

      return NextResponse.json(
        {
          error:
            "Claim not found",
        },
        {
          status: 404,
        }
      )
    }

    // =====================================
    // STATUS CHECK
    // =====================================

    if (
      claim.status !==
      "active"
    ) {

      return NextResponse.json(
        {
          error:
            "Task already submitted or closed",
        },
        {
          status: 400,
        }
      )
    }

    // =====================================
    // EXPIRED CHECK
    // =====================================

    if (
      claim.expires_at
    ) {

      const expired =
        new Date(
          claim.expires_at
        ) < new Date()

      if (expired) {

        // MARK EXPIRED
        await supabase
          .from("task_claims")
          .update({
            status:
              "expired",
          })
          .eq(
            "id",
            claim.id
          )

        // REOPEN TASK
        await supabase
          .from("tasks")
          .update({
            status:
              "open",
          })
          .eq(
            "id",
            claim.task_id
          )

        return NextResponse.json(
          {
            error:
              "Task expired",
          },
          {
            status: 400,
          }
        )
      }
    }

    // =====================================
    // DUPLICATE SUBMISSION CHECK
    // =====================================

    const {
      data: existingSubmissions,
      error: duplicateError,
    } = await supabase
      .from(
        "task_submissions"
      )
      .select(`
        id,
        submission_link
      `)

    if (duplicateError) {

      console.error(
        "DUPLICATE CHECK ERROR:",
        duplicateError
      )

      return NextResponse.json(
        {
          error:
            "Failed duplicate check",
        },
        {
          status: 500,
        }
      )
    }

    const duplicate =
      (
        existingSubmissions ||
        []
      ).find(
        (submission) => {
          return (
            submission.submission_link.trim() ===
            rawSubmission
          )
        }
      )

    if (duplicate) {

      return NextResponse.json(
        {
          error:
            "Submission already exists",
        },
        {
          status: 400,
        }
      )
    }

    // =====================================
    // CREATE SUBMISSION
    // =====================================

    const {
      error: submissionError,
    } = await supabase
      .from(
        "task_submissions"
      )
      .insert({

        claim_id:
          claim.id,

        task_id:
          claim.task_id,

        user_id:
          user.id,

        submission_link:
          rawSubmission,

        status:
          "pending",
      })

    if (
      submissionError
    ) {

      console.error(
        "SUBMISSION ERROR:",
        submissionError
      )

      return NextResponse.json(
        {
          error:
            submissionError.message,
        },
        {
          status: 500,
        }
      )
    }

    // =====================================
    // UPDATE CLAIM
    // =====================================

    const {
      error: updateError,
    } = await supabase
      .from("task_claims")
      .update({

        status:
          "submitted",
      })
      .eq(
        "id",
        claim_id
      )

    if (
      updateError
    ) {

      console.error(
        "UPDATE ERROR:",
        updateError
      )

      return NextResponse.json(
        {
          error:
            updateError.message,
        },
        {
          status: 500,
        }
      )
    }

    // =====================================
    // UPDATE TASK STATUS + SUBMISSION LINK
    // =====================================

    // Fetch task_type/platform/task_code so we know which link field to
    // populate and can sync to sheet
    const { data: taskRow } = await supabase
      .from("tasks")
      .select("task_type, task_code, platform")
      .eq("id", claim.task_id)
      .single()

    // Reply-style tasks (comment / reply / share / retweet / hyperlink
    // comment) write their proof link to comment_link; top-level content
    // tasks (post / answer / tweet / crosspost) write to post_link.
    const isReplyStyleTask = !isTopLevelTaskType(taskRow?.platform, taskRow?.task_type)

    const taskUpdatePayload: Record<string, any> = {
      status: "pending_review",
    }

    if (isReplyStyleTask) {
      taskUpdatePayload.comment_link = rawSubmission
    } else {
      taskUpdatePayload.post_link = rawSubmission
    }

    const {
      error: taskUpdateError,
    } = await supabase
      .from("tasks")
      .update(taskUpdatePayload)
      .eq(
        "id",
        claim.task_id
      )

    if (
      taskUpdateError
    ) {

      console.error(
        "TASK UPDATE ERROR:",
        taskUpdateError
      )

      return NextResponse.json(
        {
          error:
            taskUpdateError.message,
        },
        {
          status: 500,
        }
      )
    }

    // =====================================
    // SYNC POST/COMMENT LINK TO SHEET
    // =====================================
    // After saving the link to DB, update the Google Sheet
    // This ensures the sheet reflects the submitted post/comment URL
    try {
      const linkField = isReplyStyleTask ? "comment_link" : "post_link"
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

      await fetch(`${baseUrl}/api/update-sheet-field`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_code: taskRow?.task_code,
          field: linkField,
          value: rawSubmission,
        }),
      })
      // Note: We don't await or check the response - sheet updates are best-effort
      // The task has already been saved to DB successfully
    } catch (sheetError) {
      // Log but don't fail - task submission is already complete
      console.warn("Sheet sync failed (non-critical):", sheetError)
    }

    // =====================================
    // TRIGGER COOLDOWN
    // =====================================

    const [{ data: profile }, { data: platformSettings }] = await Promise.all([
      supabase
        .from("profiles")
        .select("cooldown_minutes")
        .eq("id", user.id)
        .single(),
      supabase
        .from("platform_settings")
        .select("submission_cooldown_minutes")
        .eq("id", 1)
        .single(),
    ])

    const perUserMins = Number(profile?.cooldown_minutes || 0)
    const globalMins = Number(platformSettings?.submission_cooldown_minutes || 0)
    const cooldownMins = Math.max(perUserMins, globalMins)

    if (cooldownMins > 0) {
      const cooldownUntil = new Date(Date.now() + cooldownMins * 60 * 1000).toISOString()
      await supabase
        .from("profiles")
        .update({ cooldown_until: cooldownUntil })
        .eq("id", user.id)
    }

    // =====================================
    // SUCCESS
    // =====================================

    return NextResponse.json({
      success: true,
    })

  } catch (err) {

    console.error(
      "SERVER ERROR:",
      err
    )

    return NextResponse.json(
      {
        error:
          "Server failed",
      },
      {
        status: 500,
      }
    )
  }
}
