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

    // =========================================
    // UPDATE USER APPROVAL STATUS
    // =========================================

    const approved =
      action === "approve"

    const { error: profileError } =
      await supabase
        .from("profiles")
        .update({
          approved,
        })
        .eq("id", userId)

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      )
    }

    // =========================================
    // IF APPROVED, CREATE WALLET
    // =========================================

    if (approved) {

      try {

        const { error: walletError } =
          await supabase
            .from("wallets")
            .insert({
              user_id: userId,
              balance: 0,
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