import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─────────────────────────────────────────────────────────────
// TWO-TAB SHEET STRUCTURE
//
// "Posts" tab columns:
//   A: task_id | B: task_code | C: subreddit | D: title | E: body
//   F: reward  | G: time_limit | H: min_karma | I: min_account_age_days
//
// "Comments" tab columns:
//   A: task_id | B: task_code | C: post_link | D: body
//   E: reward  | F: time_limit | G: comment_type
//
// Apps Script injects task_type = "post" | "comment" automatically
// based on which tab the row came from. No task_type column in sheet.
// ─────────────────────────────────────────────────────────────


export async function GET() {
  try {
    if (!process.env.GOOGLE_SCRIPT_URL) {
      throw new Error("GOOGLE_SCRIPT_URL is not set. Add it to .env.local.")
    }

    // ── fetch from Apps Script ─────────────────────────────
    const res = await fetch(process.env.GOOGLE_SCRIPT_URL, {
      redirect: "follow",
      cache: "no-store",
    })
    if (!res.ok) {
      throw new Error(`Apps Script returned HTTP ${res.status}.`)
    }

    const text = await res.text()
    if (!text?.trim()) throw new Error("Apps Script returned an empty response.")

    let rows: any[]
    try {
      rows = JSON.parse(text)
    } catch {
      throw new Error(`Apps Script did not return valid JSON. Got: ${text.substring(0, 300)}`)
    }

    if (!Array.isArray(rows)) {
      throw new Error(`Expected a JSON array from Apps Script, got: ${typeof rows}`)
    }

    // ── load existing codes for dedup ──────────────────────
    const { data: existingTasks, error: fetchError } = await supabase
      .from("tasks")
      .select("task_code, task_type, subreddit")

    if (fetchError) throw new Error(`Failed to load existing tasks: ${fetchError.message}`)

    const existingCodes = new Set(
      (existingTasks ?? []).map((t) => t.task_code).filter(Boolean)
    )

    // Map of task_code → existing row (for patch logic)
    const existingMap = new Map(
      (existingTasks ?? []).map((t) => [t.task_code, t])
    )

    // ── process rows ───────────────────────────────────────
    const newTasks: any[]        = []
    const skipped: string[]      = []
    const invalid: string[]      = []
    const patchedLinks: string[] = []

    for (const row of rows) {

      // ── identifier ────────────────────────────────────────
      const taskId    = row.task_id   ? String(row.task_id).trim()   : null
      const taskCode  = row.task_code ? String(row.task_code).trim() : null
      const codeForDB = taskCode ?? taskId

      if (!codeForDB) {
        invalid.push("(no id)")
        continue
      }

      if (codeForDB.toUpperCase().includes("EXAMPLE")) {
        skipped.push(codeForDB)
        continue
      }

      if (
        existingCodes.has(codeForDB) ||
        (taskId   && existingCodes.has(taskId)) ||
        (taskCode && existingCodes.has(taskCode))
      ) {
        // ── patch comment tasks: sync latest post_link from sheet ──────────
        const existing = existingMap.get(codeForDB)
          ?? existingMap.get(taskCode ?? "")
          ?? existingMap.get(taskId ?? "")
        if (existing?.task_type === "comment") {
          const rawPostLink  = row.post_link ? String(row.post_link).trim() : null
          const rawSubreddit = row.subreddit ? String(row.subreddit).trim() : null
          const subredditIsUrl = rawSubreddit?.startsWith("http") ?? false
          const linkSource = rawPostLink || (subredditIsUrl ? rawSubreddit : null)
          const patchedLink = linkSource ? linkSource.trim() : null

          // Patch if sheet has a link AND it differs from what's stored
          if (patchedLink && patchedLink !== existing.subreddit) {
            const { error: patchError } = await supabase
              .from("tasks")
              .update({ subreddit: patchedLink, post_link: patchedLink })
              .eq("task_code", codeForDB)
            if (patchError) {
              console.error(`Patch failed for ${codeForDB}: ${patchError.message}`)
              skipped.push(codeForDB)
            } else {
              patchedLinks.push(codeForDB)
            }
          } else if (!patchedLink && !existing.subreddit) {
            // post_link still missing in both sheet and DB
            invalid.push(codeForDB)
          } else {
            skipped.push(codeForDB)
          }
        } else {
          skipped.push(codeForDB)
        }
        continue
      }

      // ── task_type (injected by Apps Script from tab name) ─
      let taskType = row.task_type
        ? String(row.task_type).toLowerCase().trim()
        : null

      // Fallback: infer task_type from available fields if Apps Script didn't inject it
      if (!taskType || !["post", "comment"].includes(taskType)) {
        const hasCommentFields =
          row.comment_type ||
          (row.post_link && String(row.post_link).trim()) ||
          (row.subreddit && String(row.subreddit).startsWith("http"))
        const hasPostFields =
          row.title &&
          row.subreddit &&
          !String(row.subreddit).startsWith("http")
        if (hasCommentFields) {
          taskType = "comment"
          console.warn(`Row ${codeForDB}: inferred task_type=comment from fields`)
        } else if (hasPostFields) {
          taskType = "post"
          console.warn(`Row ${codeForDB}: inferred task_type=post from fields`)
        } else {
          console.warn(`Row ${codeForDB}: missing or invalid task_type — skipping`)
          invalid.push(codeForDB)
          continue
        }
      }

      const isComment = taskType === "comment"

      // ── body (required for all tasks) ─────────────────────
      const resolvedBody = row.body ? String(row.body).trim() : null
      if (!resolvedBody) {
        console.warn(`Row ${codeForDB}: missing body — skipping`)
        invalid.push(codeForDB)
        continue
      }

      // ── POST-specific fields ───────────────────────────────
      let taskTitle: string | null = null
      let resolvedSubreddit: string | null = null
      let minKarma: number | null = null
      let minAccountAge: number | null = null

      if (!isComment) {
        const rawTitle = row.title ? String(row.title).trim() : null
        if (!rawTitle) {
          console.warn(`Row ${codeForDB}: post task missing title — skipping`)
          invalid.push(codeForDB)
          continue
        }
        taskTitle         = rawTitle
        resolvedSubreddit = row.subreddit ? String(row.subreddit).trim() : null
        if (!resolvedSubreddit) {
          console.warn(`Row ${codeForDB}: post task missing subreddit — skipping`)
          invalid.push(codeForDB)
          continue
        }
        minKarma          = row.min_karma ? parseInt(String(row.min_karma), 10) : null
        minAccountAge     = row.min_account_age_days
          ? parseInt(String(row.min_account_age_days), 10)
          : null
      }

      // ── COMMENT-specific fields ────────────────────────────
      let resolvedPostLink: string | null = null
      let resolvedCommentType: string | null = null

      if (isComment) {
        // post_link is in its own column on the Comments tab.
        // Fallback: if it ended up in the subreddit column (old single-tab data),
        // detect and rescue it automatically.
        const rawPostLink   = row.post_link  ? String(row.post_link).trim()  : null
        const rawSubreddit  = row.subreddit  ? String(row.subreddit).trim()  : null
        const subredditIsUrl = rawSubreddit?.startsWith("http") ?? false

        const linkSource = rawPostLink || (subredditIsUrl ? rawSubreddit : null)
        resolvedPostLink = linkSource ? linkSource.trim() : null

        // For comment tasks, store the post URL in the subreddit column
        // (post_link column stays null — subreddit is the unified field)
        resolvedSubreddit = resolvedPostLink

        const validCommentTypes = ["comment", "reply", "hyperlink"]
        const rawCommentType = row.comment_type
          ? String(row.comment_type).toLowerCase().trim()
          : null
        resolvedCommentType = validCommentTypes.includes(rawCommentType ?? "")
          ? rawCommentType
          : "comment"

        // Auto-generate title from comment_type
        switch (resolvedCommentType) {
          case "reply":     taskTitle = "Reply";             break
          case "hyperlink": taskTitle = "Hyperlink Comment"; break
          default:          taskTitle = "Comment";           break
        }

        // post_link is required for comment tasks
        if (!resolvedPostLink) {
          console.warn(`Row ${codeForDB}: comment task missing post_link — skipping`)
          invalid.push(codeForDB)
          continue
        }
      }

      // ── numeric fields ─────────────────────────────────────
      const reward    = row.reward     ? parseFloat(String(row.reward))      : 0
      const timeLimit = row.time_limit ? parseInt(String(row.time_limit), 10) : 30

      newTasks.push({
        task_code:            codeForDB,
        task_type:            taskType,
        title:                taskTitle,
        body:                 resolvedBody,
        subreddit:            resolvedSubreddit,
        reward:               isNaN(reward)    ? 0  : reward,
        time_limit:           isNaN(timeLimit) ? 30 : timeLimit,
        post_link:            resolvedPostLink,
        comment_link:         null,
        comment_type:         resolvedCommentType,
        min_karma:            minKarma    !== null && !isNaN(minKarma)    ? minKarma    : null,
        min_account_age_days: minAccountAge !== null && !isNaN(minAccountAge) ? minAccountAge : null,
        sheet_row_link:       row.sheet_row_link ?? null,
        platform:             "reddit",
        status:               "draft",
        draft:                true,
        source:               "google_sheets",
      })
    }

    // ── insert ─────────────────────────────────────────────
    if (newTasks.length > 0) {
      const { error: insertError } = await supabase.from("tasks").insert(newTasks)
      if (insertError) throw new Error(`DB insert failed: ${insertError.message}`)
    }

    return NextResponse.json({
      success:  true,
      inserted: newTasks.length,
      patched:  patchedLinks.length,
      skipped:  skipped.length,
      invalid:  invalid.length,
      message:  `Imported ${newTasks.length} new task(s). Updated ${patchedLinks.length} comment task(s) with latest post_link. Skipped ${skipped.length} (already up to date)${invalid.length ? `.  ${invalid.length} row(s) missing required fields — comment tasks need post_link filled in the sheet.` : ""}.`,
    })

  } catch (err: any) {
    console.error("sync-tasks error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
