import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Delete the user (this cascades to their profile)
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (err: any) {
    console.error("DELETE USER ERROR:", err)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
