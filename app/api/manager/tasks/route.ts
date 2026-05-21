import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {

  try {

    const { data, error } =
      await supabase
        .from("tasks")
        .select(`
          *,
          task_claims!task_claims_task_fkey (
            id,
            status,
            user_id,
            profiles (
              username
            )
          )
        `)
        .order("created_at", {
          ascending: false
        })

    if (error) {

      console.log("TASK API ERROR:", error)

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log("TASKS:", data)

    return NextResponse.json(data)

  } catch (err: any) {

    console.log("SERVER ERROR:", err)

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}