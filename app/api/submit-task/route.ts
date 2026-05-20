import { NextResponse } from "next/server"

import { createUserClient } from "@/lib/taskLifecycle"

// =========================================
// NORMALIZE REDDIT URL
// =========================================

function normalizeRedditUrl(
  url: string
) {

  return url
    .trim()
    .toLowerCase()

    // DOMAIN NORMALIZATION
    .replace(
      "old.reddit.com",
      "reddit.com"
    )

    .replace(
      "www.reddit.com",
      "reddit.com"
    )

    .replace(
      "new.reddit.com",
      "reddit.com"
    )

    .replace(
      "m.reddit.com",
      "reddit.com"
    )

    // REMOVE QUERY PARAMS
    .split("?")[0]

    // REMOVE TRAILING SLASH
    .replace(/\/$/, "")
}

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
    // NORMALIZED URL
    // =====================================

    const normalizedSubmission =
      normalizeRedditUrl(
        submission_link
      )

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

          const normalized =
            normalizeRedditUrl(
              submission.submission_link
            )

          return (
            normalized ===
            normalizedSubmission
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
          normalizedSubmission,

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
    // UPDATE TASK STATUS
    // =====================================

    const {
      error: taskUpdateError,
    } = await supabase
      .from("tasks")
      .update({
        status:
          "pending_review",
      })
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
    // TRIGGER COOLDOWN
    // =====================================
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("cooldown_minutes")
      .eq("id", user.id)
      .single()
      
    const cooldownMins = profile?.cooldown_minutes || 0
    
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