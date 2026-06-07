import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {

    // get ALL withdrawals first
    const { data, error } = await supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // manually filter pending
    const pending =
      data?.filter(
        (w) =>
          w.status?.trim()?.toLowerCase() === "pending"
      ) || []

    // fetch usernames for all pending withdrawals
    const userIds = [...new Set(pending.map((w) => w.user_id))]
    const { data: profiles } = userIds.length
      ? await supabase
          .from("profiles")
          .select("id, username, email, reddit")
          .in("id", userIds)
      : { data: [] }

    const profileById = new Map((profiles || []).map((p) => [p.id, p]))

    const enriched = pending.map((w) => {
      const profile = profileById.get(w.user_id)
      return {
        ...w,
        username: profile?.username || profile?.reddit || profile?.email || w.user_id,
      }
    })

    return NextResponse.json(enriched)

  } catch (err: any) {

    console.log("SERVER ERROR:", err)

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}