import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {

  try {

    const {
      userId,
      action,
    } = await req.json()

    if (!userId || !action) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      )
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Unknown action" },
        { status: 400 }
      )
    }

    // =========================================
    // REJECT — delete the auth user. profiles.id
    // has an ON DELETE CASCADE fkey to auth.users,
    // so this removes the profile row too and
    // avoids leaving an orphaned auth account that
    // could log in with no profile.
    // =========================================

    if (action === "reject") {

      const { error: deleteError } =
        await supabase.auth.admin.deleteUser(userId)

      if (deleteError) {
        return NextResponse.json(
          { error: deleteError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
      })
    }

    // =========================================
    // APPROVE
    // =========================================

    const { error: profileError } =
      await supabase
        .from("profiles")
        .update({
          approved: true,
          approval_status: "approved",
        })
        .eq("id", userId)

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      )
    }

    // =========================================
    // CREATE WALLET
    // =========================================

    try {

      const { error: walletError } =
        await supabase
          .from("wallets")
          .insert({
            user_id: userId,
            balance_credits: 0,
          })

      if (walletError) {

        console.error(
          "Wallet creation error:",
          walletError
        )

        // Don't fail the approval if
        // wallet creation fails - wallet
        // can be created later
      }

    } catch (walletErr) {

      console.error(
        "Wallet creation failed:",
        walletErr
      )
    }

    return NextResponse.json({
      success: true,
    })

  } catch (err: any) {

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}