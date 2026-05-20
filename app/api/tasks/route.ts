import { NextResponse } from "next/server"

import {
  createAdminClient,
  createUserClient,
  expireExpiredClaims,
} from "@/lib/taskLifecycle"

export async function GET(
  req: Request
) {

  try {

    const token =
      req.headers
        .get("authorization")
        ?.replace(
          "Bearer ",
          ""
        )

    const supabase =
      token
        ? createUserClient(token)
        : createAdminClient()

    // =========================================
    // AUTO EXPIRE CLAIMS
    // =========================================

    try {

      await expireExpiredClaims(
        supabase
      )

    } catch (expiryError) {

      console.error(
        "Expired task cleanup skipped:",
        expiryError
      )
    }

    // =========================================
    // FETCH OPEN TASKS
    // =========================================

    const {
      data: tasks,
      error,
    } = await supabase
      .from("tasks")
      .select(`
        *,
        task_claims!task_claims_task_id_fkey (
          id,
          user_id,
          status,
          expires_at
        )
      `)
      .eq("draft", false)
      .in("status", [
        "open",
        "available",
        "claimed",
      ])

    if (error)
      throw error

    // =========================================
    // FILTER AVAILABLE TASKS
    // =========================================

    const now =
      new Date()

    const availableTasks =
      (tasks || []).filter(
        (task: any) => {

          const claims =
            task.task_claims || []

          // =====================================
          // FIND ACTIVE NON-EXPIRED CLAIM
          // =====================================

          const activeClaim =
            claims.find(
              (claim: any) => {

                if (
                  claim.status !==
                  "active"
                ) {
                  return false
                }

                // NO EXPIRY
                if (
                  !claim.expires_at
                ) {
                  return false
                }

                const expiry =
                  new Date(
                    claim.expires_at
                  )

                // ACTIVE + VALID
                return expiry > now
              }
            )

          // =====================================
          // SHOW ONLY AVAILABLE TASKS
          // =====================================

          return !activeClaim
        }
      )

    // =========================================
    // SORT NEWEST FIRST
    // =========================================

    availableTasks.sort(
      (a: any, b: any) => {

        const aTime =
          new Date(
            a.created_at ||
            0
          ).getTime()

        const bTime =
          new Date(
            b.created_at ||
            0
          ).getTime()

        return bTime - aTime
      }
    )

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json({
      success: true,
      tasks: availableTasks,
    })

  } catch (error: unknown) {

    const message =
      error instanceof Error
        ? error.message
        : "Failed to load tasks"

    console.error(
      "Task pool error:",
      error
    )

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    )
  }
}