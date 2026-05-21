"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  Timer,
  Send,
  Loader2,
  X,
  AlertTriangle,
  Hash,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  CheckCircle2,
  Clock3,
  Ban,
} from "lucide-react"

import { supabase } from "@/lib/supabaseClient"

import { motion } from "framer-motion"

// =========================================
// TYPES
// =========================================

type ClaimStatus =
  | "active"
  | "submitted"
  | "pending_review"
  | "approved"
  | "rejected"
  | "expired"

type ActiveClaim = {
  id: string
  task_id: string
  expires_at: string | null
  created_at: string | null
  status: ClaimStatus
}

type TaskRow = {
  id?: string

  task_code?: string

  task_type?: string

  title?: string

  body?: string

  flair?: string

  subreddit?: string

  image_link?: string

  post_link?: string

  comment_type?: string

  reward?: number | string

  time_limit?: number
}

type ActiveTask = {
  claim: ActiveClaim
  task: TaskRow
}

// =========================================
// PAGE
// =========================================

export default function ActiveTasksPage() {

  const [tasks, setTasks] =
    useState<ActiveTask[]>([])

  const [loading, setLoading] =
    useState(true)

  const [errorMsg, setErrorMsg] =
    useState("")

  const [activeTab, setActiveTab] =
    useState<
      "active" |
      "pending" |
      "approved" |
      "rejected"
    >("active")

  const [timeLeftMap, setTimeLeftMap] =
    useState<
      Record<string, number>
    >({})

  const [submissionMap, setSubmissionMap] =
    useState<
      Record<string, string>
    >({})

  const [submitting, setSubmitting] =
    useState<string | null>(
      null
    )

  const [rejecting, setRejecting] =
    useState<string | null>(
      null
    )

  const [copyState, setCopyState] =
    useState<string | null>(
      null
    )

  // =====================================
  // FETCH TASKS
  // =====================================

  const fetchTasks =
    useCallback(async () => {

      try {

        setLoading(true)

        setErrorMsg("")

        const {
          data: userData,
        } =
          await supabase.auth.getUser()

        const user =
          userData?.user

        if (!user) {

          setTasks([])

          setLoading(false)

          return
        }

        const {
          data: claims,
          error,
        } = await supabase
          .from("task_claims")
          .select(`
            *,
            tasks!task_claims_task_fkey (*)
          `)
          .eq(
            "user_id",
            user.id
          )
          .in("status", [
            "active",
            "submitted",
            "pending_review",
            "approved",
            "rejected",
          ])
          .order(
            "created_at",
            {
              ascending: false,
            }
          )

        if (error) {

          setErrorMsg(
            error.message
          )

          setLoading(false)

          return
        }

        const now =
          Date.now()

        const mapped =
          (claims || [])
            .map((item: any) => {

              const expiry =
                item.expires_at
                  ? new Date(
                      item.expires_at
                    ).getTime()
                  : 0

              // AUTO HIDE EXPIRED ACTIVE
              if (
                item.status ===
                  "active" &&
                expiry > 0 &&
                expiry <= now
              ) {
                return null
              }

              return {

                claim: {
                  id: item.id,
                  task_id:
                    item.task_id,
                  expires_at:
                    item.expires_at,
                  created_at:
                    item.created_at,
                  status:
                    item.status,
                },

                task:
                  item["tasks"] ||
                  {},
              }
            })

            .filter(Boolean)

        setTasks(
          mapped as ActiveTask[]
        )

      } catch (err) {

        console.error(err)

        setErrorMsg(
          "Failed loading tasks"
        )

      } finally {

        setLoading(false)
      }

    }, [])

  useEffect(() => {

    fetchTasks()

  }, [fetchTasks])

  // =====================================
  // TIMER
  // =====================================

  useEffect(() => {

    const interval =
      setInterval(() => {

        const updated:
          Record<
            string,
            number
          > = {}

        tasks.forEach(
          (task) => {

            if (
              task.claim
                .status !==
              "active"
            ) return

            const expiry =
              task.claim
                .expires_at

            if (!expiry)
              return

            const remaining =
              Math.max(
                0,
                Math.ceil(
                  (
                    new Date(
                      expiry
                    ).getTime() -
                    Date.now()
                  ) / 1000
                )
              )

            updated[
              task.claim.id
            ] = remaining
          }
        )

        setTimeLeftMap(
          updated
        )

      }, 1000)

    return () =>
      clearInterval(
        interval
      )

  }, [tasks])

  // =====================================
  // FILTERS
  // =====================================

  const activeTasks =
    useMemo(() => {

      return tasks.filter(
        (t) =>
          t.claim
            .status ===
            "active"
      )

    }, [tasks])

  const pendingTasks =
    useMemo(() => {

      return tasks.filter(
        (t) =>
          t.claim
            .status ===
            "submitted" ||

          t.claim
            .status ===
            "pending_review"
      )

    }, [tasks])

  const approvedTasks =
    useMemo(() => {

      return tasks.filter(
        (t) =>
          t.claim
            .status ===
            "approved"
      )

    }, [tasks])

  const rejectedTasks =
    useMemo(() => {

      return tasks.filter(
        (t) =>
          t.claim
            .status ===
            "rejected"
      )

    }, [tasks])

  const displayedTasks =
    activeTab === "active"

      ? activeTasks

      : activeTab ===
        "pending"

      ? pendingTasks

      : activeTab ===
        "approved"

      ? approvedTasks

      : rejectedTasks

  // =====================================
  // COPY
  // =====================================

  async function copyText(
    value?: string
  ) {

    if (!value) return

    await navigator.clipboard.writeText(
      value
    )

    setCopyState(value)

    setTimeout(() => {
      setCopyState(null)
    }, 1500)
  }

  // =====================================
  // SUBMIT
  // =====================================

  async function submitTask(
    claimId: string
  ) {

    if (
      submitting ||
      rejecting
    ) {
      return
    }

    const submission =
      (
        submissionMap[
          claimId
        ] || ""
      ).trim()

    if (!submission) {

      alert(
        "Enter submission link"
      )

      return
    }

    try {

      setSubmitting(
        claimId
      )

      const {
        data:
          sessionData,
      } =
        await supabase.auth.getSession()

      const token =
        sessionData
          ?.session
          ?.access_token

      const res =
        await fetch(
          "/api/submit-task",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                claim_id:
                  claimId,

                submission_link:
                  submission,
              }),
          }
        )

      const payload =
        await res.json()

      if (!res.ok) {

        alert(
          payload.error ||
            "Submit failed"
        )

        fetchTasks()

        return
      }

      alert(
        "Submitted for review"
      )

      setSubmissionMap(
        (prev) => ({
          ...prev,
          [claimId]: "",
        })
      )

      fetchTasks()

    } catch (err) {

      console.error(err)

      alert(
        "Submission failed"
      )

    } finally {

      setSubmitting(null)
    }
  }

  // =====================================
  // REJECT
  // =====================================

  async function rejectTask(
    claimId: string
  ) {

    if (
      submitting ||
      rejecting
    ) {
      return
    }

    if (
      !confirm(
        "Reject this task?"
      )
    ) {
      return
    }

    try {

      setRejecting(
        claimId
      )

      const {
        data:
          sessionData,
      } =
        await supabase.auth.getSession()

      const token =
        sessionData
          ?.session
          ?.access_token

      await fetch(
        "/api/abandon-task",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body:
            JSON.stringify({
              claim_id:
                claimId,
            }),
        }
      )

      fetchTasks()

    } catch (err) {

      console.error(err)

      alert(
        "Failed rejecting task"
      )

    } finally {

      setRejecting(null)
    }
  }

  // =====================================
  // FORMAT TIME
  // =====================================

  function formatTime(
    seconds: number
  ) {

    const mins =
      Math.floor(
        seconds / 60
      )

    const secs =
      seconds % 60

    return `${mins}:${secs
      .toString()
      .padStart(2, "0")}`
  }

  // =====================================
  // STATUS BADGE
  // =====================================

  function StatusBadge({
    status,
  }: {
    status: string
  }) {

    if (
      status ===
      "approved"
    ) {

      return (

        <div className="
          inline-flex
          items-center
          gap-2
          px-4
          py-2
          rounded-xl
          bg-emerald-500/10
          border
          border-emerald-500/20
          text-emerald-300
        ">

          <CheckCircle2
            size={16}
          />

          Approved

        </div>
      )
    }

    if (
      status ===
      "rejected"
    ) {

      return (

        <div className="
          inline-flex
          items-center
          gap-2
          px-4
          py-2
          rounded-xl
          bg-red-500/10
          border
          border-red-500/20
          text-red-300
        ">

          <Ban size={16} />

          Rejected

        </div>
      )
    }

    return (

      <div className="
        inline-flex
        items-center
        gap-2
        px-4
        py-2
        rounded-xl
        bg-yellow-500/10
        border
        border-yellow-500/20
        text-yellow-300
      ">

        <Clock3
          size={16}
        />

        Pending Review

      </div>
    )
  }

  return (

    <div className="
      max-w-6xl
      mx-auto
      p-6
      md:p-8
      font-sans
    ">

      {/* HEADER */}
      <div className="
        mb-8
      ">

        <h1 className="
          text-3xl
          font-bold
          text-white
        ">
          Active Tasks
        </h1>

        <p className="
          text-slate-400
          mt-2
        ">
          Complete Reddit tasks and submit proof.
        </p>

      </div>

      {/* ERROR */}
      {errorMsg && (

        <div className="
          mb-6
          rounded-2xl
          border
          border-red-500/20
          bg-red-500/10
          text-red-300
          p-5
        ">

          {errorMsg}

        </div>
      )}

      {/* TABS */}
      <div className="
        flex
        items-center
        gap-6
        border-b
        border-white/10
        mb-8
        overflow-x-auto
      ">

        {[
          {
            key: "active",
            label: "Active",
            count:
              activeTasks.length,
          },

          {
            key: "pending",
            label: "Pending",
            count:
              pendingTasks.length,
          },

          {
            key: "approved",
            label: "Approved",
            count:
              approvedTasks.length,
          },

          {
            key: "rejected",
            label: "Rejected",
            count:
              rejectedTasks.length,
          },

        ].map((tab) => {

          const active =
            activeTab ===
            tab.key

          return (

            <button
              key={tab.key}
              onClick={() =>
                setActiveTab(
                  tab.key as any
                )
              }
              className="
                relative
                pb-4
                whitespace-nowrap
              "
            >

              <span className={`
                text-sm
                font-medium
                transition-colors

                ${
                  active
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }
              `}>

                {tab.label}
                {" "}
                ({tab.count})

              </span>

              <div className={`
                absolute
                bottom-0
                left-0
                w-full
                h-0.5
                rounded-full

                ${
                  active
                    ? "bg-red-500"
                    : "bg-transparent"
                }
              `} />

            </button>
          )
        })}

      </div>

      {/* LOADING */}
      {loading && (

        <div className="
          flex
          items-center
          justify-center
          py-20
        ">

          <Loader2
            className="
              animate-spin
              text-red-500
            "
            size={32}
          />

        </div>
      )}

      {/* EMPTY */}
      {!loading &&
        displayedTasks.length === 0 && (

        <div className="
          border-2
          border-dashed
          border-white/10
          rounded-3xl
          p-12
          text-center
          bg-white/[0.01]
        ">

          <AlertTriangle
            className="
              mx-auto
              text-slate-500
              mb-4
            "
            size={32}
          />

          <h3 className="
            text-xl
            font-semibold
            text-white
            mb-2
          ">
            No tasks found
          </h3>

        </div>
      )}

      {/* TASKS */}
      <div className="
        space-y-6
      ">

        {displayedTasks.map(
          (item) => {

            const task =
              item.task

            const isComment =
              task.task_type ===
              "comment"

            const timeLeft =
              timeLeftMap[
                item.claim.id
              ] || 0

            return (

              <motion.div
                key={
                  item.claim.id
                }
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="
                  bg-white/[0.03]
                  border
                  border-white/10
                  rounded-3xl
                  p-7
                  backdrop-blur-xl
                "
              >

                {/* TOP */}
                <div className="
                  flex
                  flex-col
                  lg:flex-row
                  lg:items-center
                  lg:justify-between
                  gap-5
                  mb-6
                ">

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
                  ">

                    <Hash
                      size={12}
                    />

                    <span className="
                      text-slate-500
                    ">
                      TASK ID
                    </span>

                    <span className="
                      text-white
                      font-semibold
                    ">

                      {task.task_code ||
                        item.claim
                          .task_id}

                    </span>

                  </div>

                  {/* STATUS */}
                  {item.claim
                    .status !==
                    "active" && (

                    <StatusBadge
                      status={
                        item.claim
                          .status
                      }
                    />
                  )}

                </div>

                {/* DETAILS */}
                <div className="
                  space-y-5
                ">

                  {/* SUBREDDIT */}
                  {task.subreddit && (

                    <SectionCard
                      title="Subreddit"
                    >

                      <div className="
                        flex
                        items-center
                        justify-between
                        gap-4
                      ">

                        <p className="
                          text-lg
                          font-semibold
                          text-white
                        ">
                          {
                            task.subreddit
                          }
                        </p>

                        <a
                          href={
                            task.subreddit.startsWith(
                              "http"
                            )

                              ? task.subreddit

                              : `https://reddit.com/${task.subreddit}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="
                            px-4
                            py-3
                            rounded-xl
                            bg-[#FF4500]
                            text-white
                            flex
                            items-center
                            gap-2
                          "
                        >

                          <ExternalLink
                            size={16}
                          />

                          Open

                        </a>

                      </div>

                    </SectionCard>
                  )}

                  {/* POST TITLE */}
                  {task.title && (

                    <SectionCard
                      title="Post Title"
                    >

                      <div className="
                        flex
                        items-start
                        justify-between
                        gap-4
                      ">

                        <p className="
                          text-white
                          text-lg
                          font-semibold
                        ">

                          {task.title}

                        </p>

                        <CopyButton
                          copied={
                            copyState ===
                            task.title
                          }
                          onClick={() =>
                            copyText(
                              task.title
                            )
                          }
                        />

                      </div>

                    </SectionCard>
                  )}

                  {/* FLAIR */}
                  {task.flair && (

                    <SectionCard
                      title="Flair"
                    >

                      <p className="
                        text-white
                      ">

                        {task.flair}

                      </p>

                    </SectionCard>
                  )}

                  {/* POST LINK */}
                  {task.post_link && (

                    <SectionCard
                      title="Post Link"
                    >

                      <div className="
                        flex
                        items-center
                        justify-between
                        gap-4
                      ">

                        <p className="
                          text-slate-300
                        ">
                          Reddit Thread
                        </p>

                        <a
                          href={
                            task.post_link
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="
                            px-4
                            py-3
                            rounded-xl
                            bg-blue-500
                            text-white
                            flex
                            items-center
                            gap-2
                          "
                        >

                          <ExternalLink
                            size={16}
                          />

                          Open

                        </a>

                      </div>

                    </SectionCard>
                  )}

                  {/* BODY */}
                  {task.body && (

                    <SectionCard
                      title={
                        isComment

                          ? "Comment Body"

                          : "Post Body"
                      }
                    >

                      <div className="
                        flex
                        justify-end
                        mb-4
                      ">

                        <CopyButton
                          copied={
                            copyState ===
                            task.body
                          }
                          onClick={() =>
                            copyText(
                              task.body
                            )
                          }
                        />

                      </div>

                      <div className="
                        text-slate-300
                        whitespace-pre-wrap
                        break-words
                        leading-relaxed
                      ">

                        {task.body}

                      </div>

                    </SectionCard>
                  )}

                  {/* IMAGE */}
                  {task.image_link && (

                    <SectionCard
                      title="Image Link"
                    >

                      <div className="
                        flex
                        items-center
                        justify-between
                        gap-4
                      ">

                        <p className="
                          text-slate-300
                        ">
                          Open uploaded media
                        </p>

                        <a
                          href={
                            task.image_link
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="
                            px-4
                            py-3
                            rounded-xl
                            bg-green-500
                            text-white
                            flex
                            items-center
                            gap-2
                          "
                        >

                          <ImageIcon
                            size={16}
                          />

                          Open

                        </a>

                      </div>

                    </SectionCard>
                  )}

                  {/* REWARD + TIMER */}
                  <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    gap-5
                  ">

                    <SectionCard
                      title="Reward"
                    >

                      <p className="
                        text-3xl
                        font-bold
                        text-emerald-400
                      ">

                        $
                        {task.reward ||
                          0}

                      </p>

                    </SectionCard>

                    <SectionCard
                      title="Timer"
                    >

                      <div className="
                        flex
                        items-center
                        gap-3
                      ">

                        <Timer
                          size={20}
                          className="
                            text-red-300
                          "
                        />

                        <p className="
                          text-3xl
                          font-bold
                          text-red-300
                        ">

                          {formatTime(
                            timeLeft
                          )}

                        </p>

                      </div>

                      <p className="
                        text-sm
                        text-slate-400
                        mt-3
                      ">

                        Manager Limit:
                        {" "}
                        {
                          task.time_limit ||
                          0
                        }
                        m

                      </p>

                    </SectionCard>

                  </div>

                </div>

                {/* SUBMISSION */}
                {item.claim
                  .status ===
                  "active" && (

                  <div className="
                    mt-8
                    border-t
                    border-white/10
                    pt-8
                    space-y-5
                  ">

                    <SectionCard
                      title="Submission Box"
                    >

                      <input
                        className="
                          w-full
                          bg-black/30
                          border
                          border-white/10
                          rounded-xl
                          px-5
                          py-4
                          text-white
                          placeholder:text-slate-600
                          outline-none
                        "
                        placeholder="https://reddit.com/..."
                        value={
                          submissionMap[
                            item.claim.id
                          ] || ""
                        }
                        onChange={(
                          e
                        ) =>
                          setSubmissionMap(
                            (
                              prev
                            ) => ({
                              ...prev,

                              [item.claim.id]:
                                e.target
                                  .value,
                            })
                          )
                        }
                      />

                    </SectionCard>

                    <div className="
                      flex
                      flex-col
                      sm:flex-row
                      gap-3
                    ">

                      {/* SUBMIT */}
                      <button
                        onClick={() =>
                          submitTask(
                            item.claim
                              .id
                          )
                        }
                        disabled={
                          submitting ===
                            item.claim
                              .id ||

                          rejecting ===
                            item.claim
                              .id
                        }
                        className="
                          flex-1
                          bg-gradient-to-r
                          from-red-500
                          to-rose-600
                          hover:from-red-400
                          hover:to-rose-500
                          text-white
                          px-6
                          py-4
                          rounded-xl
                          font-semibold
                          flex
                          justify-center
                          items-center
                          gap-2
                        "
                      >

                        {submitting ===
                        item.claim.id ? (

                          <Loader2
                            size={20}
                            className="
                              animate-spin
                            "
                          />

                        ) : (

                          <Send
                            size={18}
                          />
                        )}

                        Submit Task

                      </button>

                      {/* REJECT */}
                      <button
                        onClick={() =>
                          rejectTask(
                            item.claim
                              .id
                          )
                        }
                        disabled={
                          submitting ===
                            item.claim
                              .id ||

                          rejecting ===
                            item.claim
                              .id
                        }
                        className="
                          sm:w-36
                          bg-white/5
                          hover:bg-white/10
                          border
                          border-white/10
                          text-slate-300
                          px-6
                          py-4
                          rounded-xl
                          font-medium
                          flex
                          justify-center
                          items-center
                          gap-2
                        "
                      >

                        {rejecting ===
                        item.claim.id ? (

                          <Loader2
                            size={18}
                            className="
                              animate-spin
                            "
                          />

                        ) : (

                          <X
                            size={18}
                          />
                        )}

                        Reject

                      </button>

                    </div>

                  </div>
                )}

              </motion.div>
            )
          }
        )}

      </div>

    </div>
  )
}

// =========================================
// SECTION CARD
// =========================================

function SectionCard({
  title,
  children,
}: any) {

  return (

    <div className="
      rounded-2xl
      border
      border-white/10
      bg-white/[0.03]
      p-5
    ">

      <p className="
        text-xs
        uppercase
        tracking-[0.2em]
        text-slate-400
        mb-4
      ">

        {title}

      </p>

      {children}

    </div>
  )
}

// =========================================
// COPY BUTTON
// =========================================

function CopyButton({
  onClick,
  copied,
}: any) {

  return (

    <button
      onClick={onClick}
      className="
        px-3
        py-2
        rounded-lg
        bg-white/5
        hover:bg-white/10
        text-sm
        flex
        items-center
        gap-2
        min-w-[90px]
        justify-center
      "
    >

      <Copy size={14} />

      {copied
        ? "Copied"
        : "Copy"}

    </button>
  )
}