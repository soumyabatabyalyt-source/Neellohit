import { NextRequest, NextResponse } from "next/server"
import { sendTasksSummaryNotification } from "@/lib/discord"
import { sendTasksSummaryNotificationTelegram } from "@/lib/telegram"

export async function POST(req: NextRequest) {
  try {
    console.log("[SEND-SUMMARY] Request received")

    const body = await req.json()

    const { tasks } = body

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid tasks array" },
        { status: 400 }
      )
    }

    console.log(
      "[SEND-SUMMARY] Sending summary notification for",
      tasks.length,
      "tasks"
    )

    // Call Discord and Telegram summary notifications (server-side)
    await Promise.all([
      sendTasksSummaryNotification({
        tasks,
      }),
      sendTasksSummaryNotificationTelegram({
        tasks,
      }),
    ])

    console.log(
      "[SEND-SUMMARY] ✅ Summary notification sent"
    )

    return NextResponse.json({
      success: true,
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to send summary notification"

    console.error(
      "[SEND-SUMMARY] Error:",
      error
    )

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
