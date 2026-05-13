"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

import {
  motion,
  AnimatePresence,
} from "framer-motion"

import {
  Hash,
} from "lucide-react"

type TaskRow = {
  id: string

  task_code?: string | null

  title?: string | null

  task_type?: string | null

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
          approved,
          suspended,
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

      if (!profile.approved) {

        setErrorMsg(
          "Await manager approval"
        )

        setTasks([])

        setLoading(false)

        return
      }

      // SUSPENDED

      if (profile.suspended) {

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

        const remainingMs =
          new Date(
            profile.cooldown_until
          ).getTime() -
          Date.now()

        const totalMinutes =
          Math.ceil(
            remainingMs / 60000
          )

        const hours =
          Math.floor(
            totalMinutes / 60
          )

        const minutes =
          totalMinutes % 60

        setCooldownMsg(
          `Cooldown active: ${hours}h ${minutes}m remaining`
        )
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

    // CLAIM DIRECTLY IN TASKS TABLE

    const {
      error
    } = await supabase
      .from("tasks")
      .update({
        status: "claimed",
        claimed_by:
          session.user.id,
        claimed_at:
          new Date().toISOString()
      })
      .eq("id", taskId)
      .eq("status", "open")

    if (error) {

      alert(
        error.message
      )

      setClaiming(null)

      return
    }

    alert(
      "Task claimed ✅"
    )

    setClaiming(null)

    await fetchTasks()
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

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.95,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          className="
            bg-red-500/10
            border
            border-red-500/20
            text-red-400
            p-6
            rounded-3xl
            max-w-md
            text-center
          "
        >

          <p className="
            font-medium
            text-lg
          ">
            {errorMsg}
          </p>

        </motion.div>

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

      <motion.div
        initial={{
          opacity: 0,
          y: -20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="
          mb-8
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

      </motion.div>

      {/* COOLDOWN */}

      <AnimatePresence>

        {cooldownMsg && (

          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            className="
              overflow-hidden
              mb-6
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

          </motion.div>
        )}

      </AnimatePresence>

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

        <div className="
          grid
          grid-cols-1
          lg:grid-cols-2
          gap-5
        ">

          {tasks.map((task) => {

            const isComment =
              task.task_type ===
              "comment"

            return (

              <motion.div
                key={task.id}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
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
                "
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

                    {task.title ||
                      "Untitled Task"}

                  </h2>

                  {/* TYPE */}

                  <p className="
                    text-sm
                    text-slate-500
                    mt-2
                    uppercase
                    tracking-[0.2em]
                  ">

                    {isComment
                      ? "Comment Task"
                      : "Post Task"}

                  </p>

                  {/* DETAILS */}

                  <div className="
                    mt-6
                    space-y-4
                  ">

                    <Detail
                      label="Subreddit"
                      value={
                        task.subreddit ||
                        "N/A"
                      }
                    />

                    <Detail
                      label="Reward"
                      value={`$${task.reward || 0}`}
                    />

                    <Detail
                      label="Time Limit"
                      value={`${task.time_limit || 30} mins`}
                    />

                    {isComment && (

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

                      Open Reddit Post

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

              </motion.div>
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