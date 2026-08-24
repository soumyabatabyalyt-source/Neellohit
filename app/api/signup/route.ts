import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/platforms"
import {
  isValidWhatsApp,
  isValidReddit,
  PLATFORM_HANDLE_VALIDATORS,
} from "@/lib/validation"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  req: NextRequest
) {

  try {

    const body =
      await req.json()

    const {
      email,
      password,
      username,
      reddit,
      discord,
      whatsapp,
      platforms,
      quora,
      facebook,
      twitter,
      reddit_karma,
      reddit_account_age_days,
    } = body

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !email ||
      !password ||
      !username ||
      !reddit ||
      !discord ||
      !whatsapp
    ) {

      return NextResponse.json(
        {
          error:
            "All fields are required",
        },
        { status: 400 }
      )
    }

    if (!isValidWhatsApp(whatsapp)) {
      return NextResponse.json(
        { error: "WhatsApp number must include a country code, e.g. +14155552671" },
        { status: 400 }
      )
    }

    if (!isValidReddit(reddit)) {
      return NextResponse.json(
        { error: "Please enter a valid Reddit username or profile link" },
        { status: 400 }
      )
    }

    // Reddit is mandatory on every account; any other platform in
    // the list is opt-in and must be one we actually support, with
    // a validly-formatted handle supplied alongside it.
    const selectedPlatforms: Platform[] = Array.isArray(platforms) && platforms.length
      ? platforms
      : ["reddit"]

    if (!selectedPlatforms.every((p) => (PLATFORMS as readonly string[]).includes(p))) {
      return NextResponse.json(
        { error: "Unknown platform selected" },
        { status: 400 }
      )
    }

    if (!selectedPlatforms.includes("reddit")) {
      return NextResponse.json(
        { error: "Reddit is required for every account" },
        { status: 400 }
      )
    }

    const platformHandles: Record<string, string | null> = { quora, facebook, twitter }

    for (const p of ["quora", "facebook", "twitter"] as const) {
      if (!selectedPlatforms.includes(p)) continue
      const value = (platformHandles[p] || "").trim()
      if (!value || !PLATFORM_HANDLE_VALIDATORS[p](value)) {
        return NextResponse.json(
          { error: `Please provide a valid ${PLATFORM_LABELS[p]} account` },
          { status: 400 }
        )
      }
    }

    // =========================================
    // CHECK DUPLICATE USERNAME
    // =========================================

    const {
      data: existingUsername,
    } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle()

    if (existingUsername) {

      return NextResponse.json(
        {
          error:
            "Username already taken",
        },
        { status: 400 }
      )
    }

    // =========================================
    // CHECK DUPLICATE REDDIT
    // =========================================

    const {
      data: existingReddit,
    } = await supabase
      .from("profiles")
      .select("id")
      .eq("reddit", reddit)
      .maybeSingle()

    if (existingReddit) {

      return NextResponse.json(
        {
          error:
            "Reddit account already used",
        },
        { status: 400 }
      )
    }

    // =========================================
    // CREATE AUTH USER
    // =========================================

    const {
      data: authData,
      error: authError,
    } =
      await supabase.auth.admin.createUser({

        email,
        password,

        email_confirm: true,
      })

    if (authError) {

      return NextResponse.json(
        {
          error:
            authError.message,
        },
        { status: 500 }
      )
    }

    const user =
      authData.user

    if (!user) {

      return NextResponse.json(
        {
          error:
            "User creation failed",
        },
        { status: 500 }
      )
    }

    // =========================================
    // CREATE PROFILE
    // =========================================

    const {
      error: profileError,
    } = await supabase
      .from("profiles")
      .insert({

        id: user.id,

        email,

        username,

        reddit,

        discord,

        whatsapp: whatsapp.trim(),

        platforms: selectedPlatforms,

        quora: selectedPlatforms.includes("quora") ? quora.trim() : null,

        facebook: selectedPlatforms.includes("facebook") ? facebook.trim() : null,

        twitter: selectedPlatforms.includes("twitter") ? twitter.trim() : null,

        role: "user",

        approved: false,

        suspended: false,

        reddit_karma: Number(reddit_karma) || 0,

        reddit_account_age_days: Number(reddit_account_age_days) || 0,
      })

    // =========================================
    // ROLLBACK IF PROFILE FAILS
    // =========================================

    if (profileError) {

      // delete broken auth user
      await supabase.auth.admin.deleteUser(
        user.id
      )

      return NextResponse.json(
        {
          error:
            profileError.message,
        },
        { status: 500 }
      )
    }

    // =========================================
    // SUCCESS
    // =========================================

    return NextResponse.json({
      success: true,
    })

  } catch (err: any) {

    console.error(
      "SIGNUP API ERROR:",
      err
    )

    return NextResponse.json(
      {
        error:
          "Internal server error",
      },
      { status: 500 }
    )
  }
}