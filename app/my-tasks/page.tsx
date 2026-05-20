"use client"

import {
  useCallback,
  useEffect,
  useState,
} from "react"

import {
  createClient
} from "@supabase/supabase-js"

import {
  motion
} from "framer-motion"

import {
  PlayCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Send
} from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ======================================================
// COUNTDOWN TIMER
// ======================================================

function CountdownTimer({
  expiresAt,
  onExpire
}: {
  expiresAt: string
  onExpire: () => void
}) {

  const [timeLeft, setTimeLeft] =
    useState("--:--")

  useEffect(() => {

    const updateTimer = () => {

      const now =
        new Date().getTime()

      const expiry =
        new Date(expiresAt).getTime()

      const distance =
        expiry - now

      if (distance <= 0) {

        setTimeLeft("00:00")

        onExpire()

        return
      }

      const minutes =
        Math.floor(
          (distance % (1000 * 60 * 60)) /
          (1000 * 60)
        )

      const seconds =
        Math.floor(
          (distance % (1000 * 60)) /
          1000
        )

      setTimeLeft(
        `${minutes
          .toString()
          .padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`
      )
    }

    updateTimer()

    const intervalId =
      setInterval(
        updateTimer,
        1000
      )

    return () =>
      clearInterval(intervalId)

  }, [
    expiresAt,
    onExpire
  ])

  return (

    <span className="
      font-mono
      text-orange-400
      font-bold
      bg-black/30
      px-3
      py-1
      rounded-lg
      border
      border-orange-500/20
      text-sm
    ">
      ⏱ {timeLeft}
    </span>
  )
}

// ======================================================
// MAIN PAGE
// ======================================================

export default function MyTasksPage() {

  const [claims, setClaims] =
    useState<any[]>([])

  // ======================================================
  // FETCH TASKS
  // ======================================================

  const fetchTasks =
    useCallback(async () => {

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      const userId =
        session.user.id

      const {
        data,
        error
      } = await supabase
        .from("task_claims")
        .select("*")
        .eq(
          "user_id",
          userId
        )
        .in(
          "status",
          [
            "active",
            "submitted",
            "approved",
            "rejected"
          ]
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        )

      if (error) {

        console.error(error)

        return
      }

      setClaims(data || [])

    }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // ======================================================
  // SUBMIT TASK
  // ======================================================

  const submitTask =
    async (task_id: string) => {

      const submission_link =
        prompt(
          "Paste your Reddit submission link"
        )

      if (!submission_link)
        return

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {

        alert(
          "Not logged in ❌"
        )

        return
      }

      // INSERT SUBMISSION

      const {
        error: submissionError
      } = await supabase
        .from("task_submissions")
        .insert([
          {
            task_id,
            user_id:
              session.user.id,
            submission_link,
            status:
              "pending"
          }
        ])

      if (submissionError) {

        alert(
          submissionError.message
        )

        return
      }

      // UPDATE TASK STATUS

      const {
        error: taskError
      } = await supabase
        .from("tasks")
        .update({
          status:
            "submitted"
        })
        .eq(
          "id",
          task_id
        )

      if (taskError) {

        alert(
          taskError.message
        )

        return
      }

      alert(
        "Task submitted successfully ✅"
      )

      fetchTasks()
    }

  // ======================================================
  // FILTERS
  // ======================================================

  const active =
    claims.filter(
      c => c.status ===
        "active"
    )

  const pending =
    claims.filter(
      c => c.status ===
        "submitted"
    )

  const approved =
    claims.filter(
      c => c.status ===
        "approved"
    )

  const failed =
    claims.filter(
      c => c.status ===
        "rejected"
    )

  // ======================================================
  // UI
  // ======================================================

  return (

    <div className="
      w-full
      font-sans
      text-slate-200
    ">

      {/* HEADER */}

      <div className="
        mb-10
        text-center
        md:text-left
      ">

        <h1 className="
          text-4xl
          md:text-5xl
          font-extrabold
          tracking-tight
          text-white
          mb-3
        ">

          Mission{" "}

          <span className="
            text-transparent
            bg-clip-text
            bg-gradient-to-br
            from-orange-400
            to-red-600
          ">
            Control
          </span>

        </h1>

        <p className="
          text-slate-400
          font-light
        ">
          Manage your claimed tasks and submissions.
        </p>

      </div>

      {/* SECTIONS */}

      <div className="
        space-y-12
      ">

        <Section
          title="Active Tasks"
          claims={active}
          submitTask={submitTask}
          icon={
            <PlayCircle
              className="
                text-orange-400
              "
              size={26}
            />
          }
          badgeTheme="
            bg-orange-500/10
            border-orange-500/30
            text-orange-400
          "
          onExpire={fetchTasks}
        />

        <Section
          title="Pending Approval"
          claims={pending}
          icon={
            <Clock
              className="
                text-blue-400
              "
              size={26}
            />
          }
          badgeTheme="
            bg-blue-500/10
            border-blue-500/30
            text-blue-400
          "
        />

        <Section
          title="Approved Tasks"
          claims={approved}
          icon={
            <CheckCircle2
              className="
                text-emerald-400
              "
              size={26}
            />
          }
          badgeTheme="
            bg-emerald-500/10
            border-emerald-500/30
            text-emerald-400
          "
        />

        <Section
          title="Rejected Tasks"
          claims={failed}
          icon={
            <XCircle
              className="
                text-rose-400
              "
              size={26}
            />
          }
          badgeTheme="
            bg-rose-500/10
            border-rose-500/30
            text-rose-400
          "
        />

      </div>

    </div>
  )
}

// ======================================================
// SECTION
// ======================================================

function Section({
  title,
  claims,
  submitTask,
  icon,
  badgeTheme,
  onExpire
}: any) {

  if (claims.length === 0)
    return null

  return (

    <div>

      {/* SECTION HEADER */}

      <div className="
        flex
        items-center
        gap-3
        mb-5
      ">

        {icon}

        <h2 className="
          text-2xl
          font-bold
          text-white
        ">
          {title}
        </h2>

      </div>

      {/* GRID */}

      <div className="
        grid
        grid-cols-1
        md:grid-cols-2
        xl:grid-cols-3
        gap-5
      ">

        {claims.map(
          (claim: any) => (

            <motion.div
              key={claim.id}
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              className="
                bg-[#0B0E13]
                border
                border-white/10
                rounded-3xl
                p-5
                flex
                flex-col
                justify-between
                min-h-[320px]
              "
            >

              {/* TOP */}

              <div>

                {/* TASK ID */}

                <p className="
                  text-[11px]
                  tracking-[0.25em]
                  uppercase
                  text-zinc-500
                  mb-3
                ">
                  {claim.task_code}
                </p>

                {/* TITLE */}

                <h3 className="
                  text-xl
                  font-bold
                  text-white
                  leading-tight
                  mb-5
                  break-words
                ">

                  {claim.title ||
                    "Untitled Task"}

                </h3>

                {/* DETAILS */}

                <div className="
                  space-y-3
                ">

                  <Detail
                    label="Subreddit"
                    value={
                      claim.subreddit ||
                      "N/A"
                    }
                  />

                  <Detail
                    label="Reward"
                    value={`$${claim.reward || 0}`}
                  />

                  <Detail
                    label="Task Type"
                    value={
                      claim.task_type
                    }
                  />

                  <Detail
                    label="Status"
                    value={
                      claim.status
                    }
                  />

                </div>

              </div>

              {/* BOTTOM */}

              <div className="
                mt-6
                flex
                flex-col
                gap-3
              ">

                {/* TIMER */}

                {claim.expires_at &&
                  claim.status ===
                    "claimed" && (

                  <CountdownTimer
                    expiresAt={
                      claim.expires_at
                    }
                    onExpire={
                      onExpire
                    }
                  />
                )}

                {/* SUBMIT BUTTON */}

                {claim.status ===
                  "claimed" && (

                  <button
                    onClick={() =>
                      submitTask(
                        claim.id
                      )
                    }
                    className="
                      w-full
                      bg-orange-500
                      hover:bg-orange-600
                      transition-all
                      rounded-2xl
                      p-4
                      font-semibold
                      flex
                      items-center
                      justify-center
                      gap-2
                    "
                  >

                    <Send size={18} />

                    Submit Task

                  </button>
                )}

                {/* REDDIT LINK */}

                {claim.post_link && (

                  <a
                    href={
                      claim.post_link
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="
                      w-full
                      bg-white/5
                      border
                      border-white/10
                      hover:bg-white/10
                      transition-all
                      rounded-2xl
                      p-4
                      flex
                      items-center
                      justify-center
                      gap-2
                      text-sm
                    "
                  >

                    <ExternalLink
                      size={16}
                    />

                    Open Reddit Post

                  </a>
                )}

              </div>

            </motion.div>
          )
        )}

      </div>

    </div>
  )
}

// ======================================================
// DETAIL
// ======================================================

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