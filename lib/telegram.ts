// =============================================
// TELEGRAM NOTIFICATIONS
// =============================================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_GROUP_CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID
const TELEGRAM_CHANNEL_CHAT_ID = process.env.TELEGRAM_CHANNEL_CHAT_ID
const TELEGRAM_API_URL = "https://api.telegram.org"

type Task = {
  id: string
  title?: string | null
  reward_credits?: number | null
  task_type?: string | null
  task_code?: string | null
  platform?: string | null
}

type TaskSummary = {
  tasks: Task[]
}

// =============================================
// PLATFORM-SPECIFIC TELEGRAM DETAILS
// =============================================

type PlatformConfig = {
  emoji: string
  label: string
  headerText: string
}

function getPlatformConfig(platform?: string | null): PlatformConfig {
  switch (platform?.toLowerCase()) {
    case "quora":
      return {
        emoji: "📍",
        label: "Quora",
        headerText: "📍 New Quora Task Available!",
      }
    case "twitter":
    case "x":
      return {
        emoji: "🐦",
        label: "Twitter/X",
        headerText: "🐦 New Twitter Task Available!",
      }
    case "facebook":
      return {
        emoji: "👥",
        label: "Facebook",
        headerText: "👥 New Facebook Task Available!",
      }
    case "reddit":
    default:
      return {
        emoji: "🔥",
        label: "Reddit",
        headerText: "🔥 New Reddit Task Available!",
      }
  }
}

async function sendTelegramMessage(chatId: string | null, text: string): Promise<void> {
  if (!chatId || !TELEGRAM_BOT_TOKEN) {
    return
  }

  try {
    const url = `${TELEGRAM_API_URL}/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`[Telegram] Failed to send message (${response.status}):`, error)
    } else {
      console.log("[Telegram] ✅ Message sent successfully!")
    }
  } catch (err) {
    console.error("[Telegram] Error sending message:", err)
  }
}

export async function sendTaskAvailableNotificationTelegram(task: Task): Promise<void> {
  console.log("[Telegram] sendTaskAvailableNotificationTelegram called with task:", task)

  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("[Telegram] TELEGRAM_BOT_TOKEN not set — skipping notification")
    return
  }

  const taskType = task.task_type || "General"
  const rewardDollars = task.reward_credits != null ? (task.reward_credits / 100).toFixed(2) : null
  const reward = rewardDollars != null ? `$${rewardDollars}` : "N/A"
  const taskId = task.task_code || task.id

  const platformConfig = getPlatformConfig(task.platform)

  const message = `
<b>${platformConfig.headerText}</b>

<b>🎫 Task ID:</b> <code>${taskId}</code>
<b>📌 Type:</b> <code>${taskType}</code>
<b>💎 Reward:</b> <code>${reward}</code>

<a href="https://neellohit.xyz">🔗 Claim Task on Neellohit</a>

✨ Neellohit • Earn Credits Today
`.trim()

  // Send to group
  await sendTelegramMessage(TELEGRAM_GROUP_CHAT_ID || null, message)

  // Send to channel
  await sendTelegramMessage(TELEGRAM_CHANNEL_CHAT_ID || null, message)
}

export async function sendTasksSummaryNotificationTelegram(summary: TaskSummary): Promise<void> {
  return sendSummaryNotificationTelegram(summary)
}

export async function sendSummaryNotificationTelegram(summary: TaskSummary): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("[Telegram] TELEGRAM_BOT_TOKEN not set — skipping summary notification")
    return
  }

  // Group tasks by platform
  const tasksByPlatform = summary.tasks.reduce(
    (acc, t) => {
      const platform = t.platform || "reddit"
      if (!acc[platform]) {
        acc[platform] = []
      }
      acc[platform].push(t)
      return acc
    },
    {} as Record<string, Task[]>
  )

  // Build task list grouped by platform
  const taskList = Object.entries(tasksByPlatform)
    .map(([platform, tasks]) => {
      const config = getPlatformConfig(platform)
      const platformTasks = tasks
        .map((t) => {
          const id = t.task_code || t.id
          const reward = t.reward_credits != null ? `${t.reward_credits} credits` : "N/A"
          return `• <code>${id}</code> (${t.task_type || "general"}) — ${reward}`
        })
        .join("\n")
      return `<b>${config.emoji} ${config.label}</b>\n${platformTasks}`
    })
    .join("\n\n")

  const message = `
<b>📋 Task Summary</b>

${taskList}

✨ Neellohit • Earn Credits Today
`.trim()

  // Send to group
  await sendTelegramMessage(TELEGRAM_GROUP_CHAT_ID || null, message)

  // Send to channel
  await sendTelegramMessage(TELEGRAM_CHANNEL_CHAT_ID || null, message)
}
