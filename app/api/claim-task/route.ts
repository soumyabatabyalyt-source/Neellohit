import { NextRequest, NextResponse } from "next/server"

import { createUserClient } from "@/lib/taskLifecycle"

export async function POST(
  req: NextRequest
) {

  try {

    // =========================================
    // AUTH TOKEN
    // =========================================

    const token =
      req.headers
        .get("authorization")
        ?.replace(
          "Bearer ",
          ""
        )

    if (!token) {

      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      )
    }

    // =========================================
    // GET USER
    // =========================================

    const supabase = createUserClient(token)

    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser(
      token
    )

    if (
      authError ||
      !authData.user
    ) {

      return NextResponse.json(
        {
          error:
            "Invalid session",
        },
        {
          status: 401,
        }
      )
    }

    const user =
      authData.user

    // =========================================
    // BODY
    // =========================================

    const body =
      await req.json()

    const task_id =
      body.task_id

    if (!task_id) {

      return NextResponse.json(
        {
          error:
            "Missing task_id",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================
    // CLEANUP EXPIRED CLAIMS
    // =========================================

    const nowIso =
      new Date().toISOString()

    const {
      data: expiredClaims,
    } = await supabase
      .from("task_claims")
      .select(`
        id,
        task_id
      `)
      .eq("status", "active")
      .lt(
        "expires_at",
        nowIso
      )

    if (
      expiredClaims &&
      expiredClaims.length > 0
    ) {

      const expiredIds =
        expiredClaims.map(
          (c) => c.id
        )

      const expiredTaskIds =
        expiredClaims.map(
          (c) => c.task_id
        )

      // MARK CLAIMS EXPIRED
      await supabase
        .from("task_claims")
        .update({
          status: "expired",
        })
        .in("id", expiredIds)

      // RETURN TASKS TO POOL
      await supabase
        .from("tasks")
        .update({
          status: "open",
        })
        .in("id", expiredTaskIds)
    }

    // =========================================
    // PROFILE CHECK
    // =========================================

    const {
      data: profile,
    } = await supabase
      .from("profiles")
      .select(`
        approved,
        suspended,
        cooldown_until
      `)
      .eq("id", user.id)
      .single()

    if (!profile?.approved) {

      return NextResponse.json(
        {
          error:
            "Await manager approval",
        },
        {
          status: 403,
        }
      )
    }

    if (profile?.suspended) {

      return NextResponse.json(
        {
          error:
            "Account suspended",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================
    // COOLDOWN CHECK
    // =========================================

    if (
      profile?.cooldown_until &&
      new Date(
        profile.cooldown_until
      ) > new Date()
    ) {

      return NextResponse.json(
        {
          error:
            "Cooldown active",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================
    // USER ACTIVE CLAIM CHECK
    // =========================================

    const {
      data: existingClaim,
    } = await supabase
      .from("task_claims")
      .select(`
        id,
        expires_at
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (existingClaim) {

      return NextResponse.json(
        {
          error:
            "Finish your current task first",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================
    // CHECK TASK EXISTS
    // =========================================

    const {
      data: task,
    } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", task_id)
      .single()

    if (!task) {

      return NextResponse.json(
        {
          error:
            "Task not found",
        },
        {
          status: 404,
        }
      )
    }

    // =========================================
    // TASK STATUS CHECK
    // =========================================

    if (
      task.status !== "open" &&
      task.status !== "available"
    ) {

      return NextResponse.json(
        {
          error:
            "Task unavailable",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================
    // CHECK TASK CLAIMED
    // =========================================

    const {
      data: activeTaskClaim,
    } = await supabase
      .from("task_claims")
      .select("id")
      .eq("task_id", task_id)
      .eq("status", "active")
      .maybeSingle()

    if (activeTaskClaim) {

      return NextResponse.json(
        {
          error:
            "Task already claimed",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================
    // TIMER
    // =========================================

    const minutes =
      Number(
        task.time_limit || 30
      )

    const expiresAt =
      new Date(
        Date.now() +
          minutes *
            60 *
            1000
      ).toISOString()

    // =========================================
    // CREATE CLAIM
    // =========================================

    const {
      error: insertError,
    } = await supabase
      .from("task_claims")
      .insert({

        task_id,

        user_id: user.id,

        status: "active",

        expires_at:
          expiresAt,
      })

    if (insertError) {

      console.error(
        insertError
      )

      return NextResponse.json(
        {
          error:
            "Claim failed",
        },
        {
          status: 500,
        }
      )
    }

    // =========================================
    // UPDATE TASK STATUS
    // =========================================

    await supabase
      .from("tasks")
      .update({
        status: "claimed",
      })
      .eq("id", task_id)

    // =========================================
    // SUCCESS
    // =========================================

    return NextResponse.json({
      success: true,
    })

  } catch (err) {

    console.error(err)

    return NextResponse.json(
      {
        error:
          "Server error",
      },
      {
        status: 500,
      }
    )
  }
}