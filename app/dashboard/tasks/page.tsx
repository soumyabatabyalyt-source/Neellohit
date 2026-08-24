"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

import {
  Hash,
} from "lucide-react"

import {
  normalizePlatform,
  isTopLevelTaskType,
  getPlatformLabel,
  PLATFORM_TARGET_LABEL,
  PLATFORM_LINK_LABEL,
} from "@/lib/platforms"

type TaskRow = {
  id: string

  task_code?: string | null

  title?: string | null

  task_type?: string | null

  platform?: string | null

  subreddit?: string | null

  flair?: string | null

  body?: string | null

  image_link?: string | null

  post_link?: string | null

  comment_type?: string | null

  reward?: number | string | null

  time_limit?: number | null

  status?: string | null
}

// Helper function to get task display title
function getTaskTitle(task: TaskRow): string {
  if (task.title) return task.title

  // For non-Reddit platforms without title, show platform and task type
  if (task.platform && task.platform !== "reddit") {
    const platform = task.platform.charAt(0).toUpperCase() + task.platform.slice(1)
    const taskType = task.task_type ? task.task_type.charAt(0).toUpperCase() + task.task_type.slice(1) : "Task"
    return `${platform} · ${taskType}`
  }

  // For Reddit comment tasks without title, generate from comment_type
  if (task.task_type === "comment" && task.comment_type) {
    switch (task.comment_type.toLowerCase()) {
      case "reply":
        return "Reply"
      case "hyperlink":
        return "Hyperlink Comment"
      case "comment":
      default:
        return "Comment"
    }
  }

  return "Untitled Task"
}

export default function TasksPage() {

  const [tasks, setTasks] =
    useState<TaskRow[]>([])

  const [loading, setLoading] =
    useState(true)

  const [claiming, setClaiming] =
    useState<string | null>(null)

  const [errorMsg, setErrorMsg] =
    useState("")

  const [cooldownMsg, setCooldownMsg] =
    useState("")

  const [cooldownUntil, setCooldownUntil] =
    useState<string | null>(null)

  // =========================================
  // FETCH TASKS
  // =========================================

  const fetchTasks =
    useCallback(async () => {

      setLoading(true)

      setErrorMsg("")

      setCooldownMsg("")

      // SESSION

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {

        setErrorMsg(
          "Login required"
        )

        setTasks([])

        setLoading(false)

        return
      }

      // PROFILE

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(`
          approval_status,
          cooldown_until
        `)
        .eq(
          "id",
          session.user.id
        )
        .single()

      if (
        profileError ||
        !profile
      ) {

        setErrorMsg(
          "Profile fetch failed"
        )

        setTasks([])

        setLoading(false)

        return
      }

      // APPROVED

      if (profile.approval_status !== 'approved') {

        setErrorMsg(
          "Await manager approval"
        )

        setTasks([])

        setLoading(false)

        return
      }

      // SUSPENDED

      if (profile.approval_status === 'suspended') {

        setErrorMsg(
          "Account suspended"
        )

        setTasks([])

        setLoading(false)

        return
      }

      // COOLDOWN

      if (
        profile.cooldown_until &&
        new Date(
          profile.cooldown_until
        ) > new Date()
      ) {

        setCooldownUntil(
          profile.cooldown_until
        )

      } else {

        setCooldownUntil(null)
        setCooldownMsg("")
      }

      // FETCH TASKS

      const {
        data,
        error
      } = await supabase
        .from("tasks")
        .select("*")
        .eq("status", "open")
        .eq("draft", false)
        .order(
          "created_at",
          {
            ascending: false
          }
        )

      if (error) {

        setErrorMsg(
          error.message
        )

        setTasks([])

      } else {

        setTasks(data || [])
      }

      setLoading(false)

    }, [])

  // =========================================
  // INITIAL LOAD
  // =========================================

  useEffect(() => {

    void fetchTasks()

  }, [fetchTasks])

  // =========================================
  // COOLDOWN TIMER
  // =========================================

  useEffect(() => {

    if (!cooldownUntil) return

    const updateTimer = () => {

      const now = new Date()
      const end = new Date(cooldownUntil)
      const remainingMs = end.getTime() - now.getTime()

      if (remainingMs <= 0) {

        setCooldownMsg("")
        setCooldownUntil(null)
        return
      }

      const totalSeconds = Math.ceil(remainingMs / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60

      setCooldownMsg(
        `Cooldown active: ${hours}h ${minutes}m ${seconds}s remaining`
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)

  }, [cooldownUntil])

  // =========================================
  // CLAIM TASK
  // =========================================

  async function claimTask(
    taskId: string
  ) {

    setClaiming(taskId)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {

      alert("Login required")

      setClaiming(null)

      return
    }

    // CALL CLAIM API ENDPOINT

    try {

      const token =
        session.access_token

      const res =
        await fetch(
          "/api/claim-task",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
              task_id: taskId,
            }),
          }
        )

      const data =
        await res.json()

      if (!res.ok) {

        alert(
          data.error ||
            "Claim failed"
        )

        setClaiming(null)

        return
      }

      alert(
        "Task claimed ✅"
      )

      setClaiming(null)

      await fetchTasks()

    } catch (err) {

      console.error(err)

      alert(
        "Claim failed"
      )

      setClaiming(null)
    }
  }

  // =========================================
  // LOADING
  // =========================================

  if (loading) {

    return (

      <div className="
        max-w-6xl
        mx-auto
        p-6
      ">

        <div className="
          h-8
          w-48
          bg-white/5
          rounded-lg
          animate-pulse
          mb-8
        " />

        <div className="
          grid
          gap-4
        ">

          {[1, 2, 3].map((i) => (

            <div
              key={i}
              className="
                border
                border-white/5
                bg-white/[0.02]
                rounded-3xl
                p-6
                h-48
                animate-pulse
              "
            />
          ))}

        </div>

      </div>
    )
  }

  // =========================================
  // ERROR
  // =========================================

  if (errorMsg) {

    return (

      <div className="
        max-w-5xl
        mx-auto
        p-6
        flex
        items-center
        justify-center
        min-h-[50vh]
      ">

        <div
          className="
            bg-red-500/10
            border
            border-red-500/20
            text-red-400
            p-6
            rounded-3xl
            max-w-md
            text-center
            animate-in fade-in zoom-in-95 duration-300
          "
        >

          <p className="
            font-medium
            text-lg
          ">
            {errorMsg}
          </p>

        </div>

      </div>
    )
  }

  // =========================================
  // MAIN UI
  // =========================================

  return (

    <div className="
      max-w-6xl
      mx-auto
      p-4
      md:p-8
      w-full
    ">

      {/* HEADER */}

      <div
        className="
          mb-8
          animate-in fade-in slide-in-from-top-4 duration-300
        "
      >

        <h1 className="
          text-4xl
          font-bold
          text-white
          tracking-tight
        ">
          Task Pool
        </h1>

        <p className="
          text-slate-400
          mt-2
        ">
          Browse and claim available tasks.
        </p>

      </div>

      {/* COOLDOWN */}

      {cooldownMsg && (

        <div
          className="
            overflow-hidden
            mb-6
            animate-in fade-in slide-in-from-top-4 duration-300
          "
        >

          <div className="
            rounded-2xl
            border
            border-amber-500/30
            bg-amber-500/10
            px-5
            py-4
            text-amber-300
          ">

            {cooldownMsg}

          </div>

        </div>
      )}

      {/* EMPTY */}

      {tasks.length === 0 ? (

        <div className="
          border-2
          border-dashed
          border-white/10
          rounded-3xl
          p-12
          text-center
          bg-white/[0.01]
        ">

          <h3 className="
            text-2xl
            font-semibold
            text-white
            mb-3
          ">
            No tasks available
          </h3>

          <p className="
            text-slate-400
          ">
            Check back later for new work.
          </p>

        </div>

      ) : (

        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-2
            gap-5
          "
        >

          {tasks.map((task, index) => {

            const platform = normalizePlatform(task.platform)
            const isTopLevel = isTopLevelTaskType(platform, task.task_type)
            const targetLabel = PLATFORM_TARGET_LABEL[platform]
            const linkLabel = PLATFORM_LINK_LABEL[platform]

            return (

              <div
                key={task.id}
                className="
                  border
                  border-white/10
                  bg-white/[0.03]
                  backdrop-blur-xl
                  rounded-3xl
                  p-6
                  flex
                  flex-col
                  justify-between
                  min-h-[340px]
                  animate-in fade-in slide-in-from-bottom-4 duration-400 hover:scale-102 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] transition-all"
                  style={{ animationDelay: `${index * 100}ms` }}
              >

                {/* TOP */}

                <div>

                  {/* TASK ID */}

                  <div className="
                    inline-flex
                    items-center
                    gap-2
                    px-4
                    py-2
                    rounded-full
                    bg-black/30
                    border
                    border-white/10
                    text-xs
                    font-mono
                    tracking-wide
                    mb-5
                  ">

                    <Hash size={12} />

                    <span className="
                      text-slate-500
                    ">
                      TASK ID
                    </span>

                    <span className="
                      text-white
                      font-semibold
                    ">
                      {task.task_code}
                    </span>

                  </div>

                  {/* TITLE */}

                  <h2 className="
                    text-2xl
                    font-bold
                    text-white
                    leading-tight
                    break-words
                  ">

                    {getTaskTitle(task)}

                  </h2>

                  {/* TYPE */}

                  <p className="
                    text-sm
                    text-slate-500
                    mt-2
                    uppercase
                    tracking-[0.2em]
                  ">

                    {getPlatformLabel(platform)} · {task.task_type}

                  </p>

                  {/* DETAILS */}

                  <div className="
                    mt-6
                    space-y-4
                  ">

                    {isTopLevel && (
                      <Detail
                        label={targetLabel}
                        value={
                          task.subreddit ||
                          "N/A"
                        }
                      />
                    )}

                    <Detail
                      label="Reward"
                      value={`$${task.reward || 0}`}
                    />

                    <Detail
                      label="Time Limit"
                      value={`${task.time_limit || 30} mins`}
                    />

                    {platform === "reddit" && !isTopLevel && (

                      <Detail
                        label="Comment Type"
                        value={
                          task.comment_type ||
                          "Comment"
                        }
                      />
                    )}

                  </div>

                </div>

                {/* BOTTOM */}

                <div className="
                  mt-8
                  flex
                  flex-col
                  gap-4
                ">

                  {/* LINKS */}

                  {task.post_link && (

                    <a
                      href={
                        task.post_link
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        flex
                        items-center
                        justify-center
                        gap-2
                        rounded-2xl
                        border
                        border-white/10
                        bg-white/[0.03]
                        hover:bg-white/[0.06]
                        transition-all
                        px-5
                        py-4
                        text-sm
                      "
                    >

                      Open {linkLabel}

                    </a>
                  )}

                  {/* CLAIM BUTTON */}

                  <button
                    onClick={() =>
                      claimTask(
                        task.id
                      )
                    }
                    disabled={
                      claiming ===
                      task.id
                    }
                    className="
                      bg-gradient-to-r
                      from-red-500
                      to-rose-600
                      hover:from-red-400
                      hover:to-rose-500
                      transition-all
                      text-white
                      px-6
                      py-4
                      rounded-2xl
                      font-semibold
                      disabled:opacity-50
                    "
                  >

                    {claiming ===
                    task.id
                      ? "Claiming..."
                      : "Claim Task"}

                  </button>

                </div>

              </div>
            )
          })}

        </div>
      )}

    </div>
  )
}

// =========================================
// DETAIL
// =========================================

function Detail({
  label,
  value
}: any) {

  return (

    <div className="
      flex
      flex-col
      sm:flex-row
      sm:items-start
      justify-between
      gap-2
      border-b
      border-white/5
      pb-3
    ">

      <span className="
        text-zinc-500
        text-sm
        shrink-0
      ">
        {label}
      </span>

      <span className="
        text-white
        font-medium
        text-sm
        text-left
        sm:text-right
        break-all
        max-w-full
        sm:max-w-[65%]
      ">
        {value}
      </span>

    </div>
  )
}
