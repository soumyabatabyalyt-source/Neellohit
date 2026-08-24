import { NextRequest, NextResponse } from "next/server"
import { sendTaskAvailableNotification } from "@/lib/discord"
import { sendTaskAvailableNotificationTelegram } from "@/lib/telegram"

export async function POST(req: NextRequest) {
  try {
    console.log("[SEND-NOTIFICATION] Request received")

    const body = await req.json()

    const { id, title, task_type, reward_credits, task_code, platform } = body

    if (!id) {
      return NextResponse.json(
        { error: "Missing task ID" },
        { status: 400 }
      )
    }

    console.log(
      "[SEND-NOTIFICATION] Sending notification for task:",
      id
    )

    // Call Discord and Telegram notifications (server-side)
    await Promise.all([
      sendTaskAvailableNotification({
        id,
        title,
        task_type,
        reward_credits,
        task_code,
        platform,
      }),
      sendTaskAvailableNotificationTelegram({
        id,
        title,
        task_type,
        reward_credits,
        task_code,
        platform,
      }),
    ])

    console.log(
      "[SEND-NOTIFICATION] ✅ Notification sent"
    )

    return NextResponse.json({
      success: true,
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to send notification"

    console.error(
      "[SEND-NOTIFICATION] Error:",
      error
    )

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
