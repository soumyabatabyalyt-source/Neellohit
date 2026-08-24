// =============================================
// DISCORD WEBHOOK NOTIFICATIONS
// =============================================

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL
const WEBSITE_URL = "https://neellohit.xyz"

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
// PLATFORM-SPECIFIC NOTIFICATION DETAILS
// =============================================

type PlatformConfig = {
  emoji: string
  color: number
  label: string
  contentPrefix: string
}

function getPlatformConfig(platform?: string | null): PlatformConfig {
  switch (platform?.toLowerCase()) {
    case "quora":
      return {
        emoji: "📍",
        color: 0xff6b35, // Orange-red for Quora
        label: "Quora",
        contentPrefix: "📍 New Quora Task Available!",
      }
    case "twitter":
    case "x":
      return {
        emoji: "🐦",
        color: 0x1da1f2, // Twitter blue
        label: "Twitter/X",
        contentPrefix: "🐦 New Twitter Task Available!",
      }
    case "facebook":
      return {
        emoji: "👥",
        color: 0x1877f2, // Facebook blue
        label: "Facebook",
        contentPrefix: "👥 New Facebook Task Available!",
      }
    case "reddit":
    default:
      return {
        emoji: "🔥",
        color: 0xff4500, // Reddit orange
        label: "Reddit",
        contentPrefix: "🔥 New Reddit Task Available!",
      }
  }
}

export async function sendTaskAvailableNotification(task: Task): Promise<void> {
  console.log("[Discord] sendTaskAvailableNotification called with task:", task)
  console.log("[Discord] DISCORD_WEBHOOK_URL:", DISCORD_WEBHOOK_URL ? "SET" : "NOT SET")

  if (!DISCORD_WEBHOOK_URL) {
    console.warn("[Discord] DISCORD_WEBHOOK_URL not set — skipping notification")
    return
  }

  const taskType = task.task_type || "General"
  const rewardDollars = task.reward_credits != null ? (task.reward_credits / 100).toFixed(2) : null
  const reward = rewardDollars != null ? `$${rewardDollars}` : "N/A"
  const taskId = task.task_code || task.id

  const platformConfig = getPlatformConfig(task.platform)

  console.log("[Discord] Preparing notification with:", { taskId, taskType, reward, platform: task.platform })

  const embed = {
    title: `${platformConfig.emoji} New ${platformConfig.label} Task Available!`,
    color: platformConfig.color,
    fields: [
      {
        name: "🎫 Task ID",
        value: `\`${taskId}\``,
        inline: true,
      },
      {
        name: "📌 Type",
        value: `\`${taskType}\``,
        inline: true,
      },
      {
        name: "💎 Reward",
        value: `\`${reward}\``,
        inline: true,
      },
      {
        name: "🔗 Claim Task",
        value: `[Open on Neellohit](${WEBSITE_URL})`,
        inline: false,
      },
    ],
    footer: {
      text: `✨ Neellohit • Earn Credits Today`,
    },
  }

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `@everyone ${platformConfig.contentPrefix}`,
        username: "Neellohit Bot",
        avatar_url: "https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png",
        embeds: [embed],
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`[Discord] Webhook failed (${response.status}):`, text)
    } else {
      console.log("[Discord] ✅ Notification sent successfully!")
    }
  } catch (err) {
    // Never throw from notification helpers — log and move on
    console.error("[Discord] Error sending notification:", err)
  }
}

export async function sendTasksSummaryNotification(summary: TaskSummary): Promise<void> {
  return sendSummaryNotification(summary)
}

export async function sendSummaryNotification(summary: TaskSummary): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn("[Discord] DISCORD_WEBHOOK_URL not set — skipping summary notification")
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
          return `• \`${id}\` (${t.task_type || "general"}) — ${reward}`
        })
        .join("\n")
      return `**${config.emoji} ${config.label}**\n${platformTasks}`
    })
    .join("\n\n") || "No tasks available."

  const embed = {
    title: "📋 Task Summary",
    description: taskList,
    color: 0x5865f2,
    footer: {
      text: "✨ Neellohit • Earn Credits Today",
    },
  }

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "📢 Here are the currently available tasks:",
        username: "Neellohit Bot",
        avatar_url: "https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png",
        embeds: [embed],
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`[Discord] Summary webhook failed (${response.status}):`, text)
    } else {
      console.log("[Discord] ✅ Summary notification sent successfully!")
    }
  } catch (err) {
    console.error("[Discord] Error sending summary notification:", err)
  }
}
