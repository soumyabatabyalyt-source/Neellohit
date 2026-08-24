// =========================================
// PLATFORM CONFIG
//
// Central source of truth for every platform the
// task pool supports (Reddit, Quora, Facebook,
// Twitter/X). Add a new platform here and the
// task-creation form, task pool, my-tasks, and
// draft review screens all pick it up.
// =========================================

export const PLATFORMS = [
  "reddit",
  "quora",
  "facebook",
  "twitter",
] as const

export type Platform = (typeof PLATFORMS)[number]

export function isPlatform(value: unknown): value is Platform {
  return (
    typeof value === "string" &&
    (PLATFORMS as readonly string[]).includes(value)
  )
}

// Fall back to "reddit" for legacy rows saved before
// the platform column was populated everywhere.
export function normalizePlatform(value: unknown): Platform {
  return isPlatform(value) ? value : "reddit"
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  reddit: "Reddit",
  quora: "Quora",
  facebook: "Facebook",
  twitter: "Twitter / X",
}

// Brand color used for the small platform badge/icon
// chip shown on task cards.
export const PLATFORM_COLORS: Record<Platform, string> = {
  reddit: "#FF4500",
  quora: "#B92B27",
  facebook: "#1877F2",
  twitter: "#000000",
}

// Single-letter/short glyph shown in the round badge
// (kept ASCII so it renders without an icon font).
export const PLATFORM_GLYPH: Record<Platform, string> = {
  reddit: "r",
  quora: "Q",
  facebook: "f",
  twitter: "X",
}

export type TaskTypeOption = {
  value: string
  label: string
  // true  = the tasker creates brand-new content (a subreddit post,
  //         a Quora answer, a Facebook post, a tweet) — needs a
  //         "target" (where it goes), no link to existing content.
  // false = the tasker reacts to existing content (comment, reply,
  //         share, retweet, hyperlink comment) — needs a link to
  //         the existing post/thread instead of a target.
  isTopLevel: boolean
}

export const PLATFORM_TASK_TYPES: Record<Platform, TaskTypeOption[]> = {
  reddit: [
    { value: "post", label: "Post", isTopLevel: true },
    { value: "hyperlink_post", label: "Hyperlink Post", isTopLevel: true },
    { value: "crosspost", label: "Crosspost", isTopLevel: true },
    { value: "comment", label: "Comment", isTopLevel: false },
    { value: "reply", label: "Reply", isTopLevel: false },
    { value: "hyperlink_comment", label: "Hyperlink Comment", isTopLevel: false },
  ],
  quora: [
    { value: "answer", label: "Answer", isTopLevel: true },
    { value: "comment", label: "Comment", isTopLevel: false },
  ],
  facebook: [
    { value: "post", label: "Post", isTopLevel: true },
    { value: "comment", label: "Comment", isTopLevel: false },
    { value: "share", label: "Share", isTopLevel: false },
  ],
  twitter: [
    { value: "tweet", label: "Tweet", isTopLevel: true },
    { value: "reply", label: "Reply", isTopLevel: false },
    { value: "retweet", label: "Retweet", isTopLevel: false },
  ],
}

// What to call the "where does this go" field per platform
// (subreddit name / Quora question or topic / Facebook page
// or group / left blank for a fresh tweet).
export const PLATFORM_TARGET_LABEL: Record<Platform, string> = {
  reddit: "Subreddit",
  quora: "Question / Topic",
  facebook: "Page / Group",
  twitter: "Topic (optional)",
}

export const PLATFORM_TARGET_PLACEHOLDER: Record<Platform, string> = {
  reddit: "r/AskReddit",
  quora: "https://www.quora.com/... or topic name",
  facebook: "Page or Group name / URL",
  twitter: "Optional hashtag or topic",
}

// What to call the "link to existing content" field per
// platform, for reply-style tasks (comment/reply/share/retweet).
export const PLATFORM_LINK_LABEL: Record<Platform, string> = {
  reddit: "Post Link",
  quora: "Answer Link",
  facebook: "Post Link",
  twitter: "Tweet Link",
}

export function getTaskTypeOptions(platform: string): TaskTypeOption[] {
  return PLATFORM_TASK_TYPES[normalizePlatform(platform)]
}

export function isTopLevelTaskType(
  platform: string | null | undefined,
  taskType: string | null | undefined
): boolean {
  const options = PLATFORM_TASK_TYPES[normalizePlatform(platform)]
  const match = options.find((option) => option.value === taskType)
  // Unknown combo (legacy data) — default to "post" behaviour so
  // existing Reddit rows keep working exactly as before.
  return match ? match.isTopLevel : taskType !== "comment"
}

export function getPlatformLabel(platform: string | null | undefined): string {
  return PLATFORM_LABELS[normalizePlatform(platform)]
}

// Best-effort external link for a target that isn't already a
// full URL (mirrors the old hardcoded reddit.com/${subreddit}).
export function resolveTargetUrl(
  platform: string | null | undefined,
  target: string | null | undefined
): string | null {
  if (!target) return null
  if (target.startsWith("http")) return target

  switch (normalizePlatform(platform)) {
    case "reddit":
      return `https://reddit.com/${target}`
    case "facebook":
      return `https://facebook.com/${target}`
    default:
      return null
  }
}
