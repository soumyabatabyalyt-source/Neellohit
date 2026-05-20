"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import { motion } from "framer-motion"

import { supabase } from "@/lib/supabaseClient"

import {
  Clock,
  CheckCircle,
  XCircle,
  Hash,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

type Claim = {
  id: string
  task_id: string
  expires_at: string
  status: string
  created_at?: string

  tasks: {
    id: string

    task_code?: string

    task_type?: string
    title?: string
    body?: string

    reward?: number

    subreddit?: string
    comment_type?: string
    post_link?: string
    rejection_reason?: string
  }
}

const ITEMS_PER_PAGE = 20

export default function MyTasksPage() {

  const [claims, setClaims] =
    useState<Claim[]>([])

  const [loading, setLoading] =
    useState(true)

  const [activeTab, setActiveTab] =
    useState<
      | "active"
      | "pending"
      | "approved"
      | "rejected"
    >("active")

  const [page, setPage] =
    useState(1)

  // =========================================
  // FETCH CLAIMS
  // =========================================

  useEffect(() => {

    fetchClaims()

  }, [])

  const fetchClaims = async () => {

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    try {

      // FETCH CLAIMS
      const { data: claims_data, error: claimsError } =
        await supabase
          .from("task_claims")
          .select("*")
          .eq(
            "user_id",
            user.id
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )

      if (claimsError) throw claimsError

      if (!claims_data || claims_data.length === 0) {
        setClaims([])
        setLoading(false)
        return
      }

      // FETCH ASSOCIATED TASKS
      const taskIds = claims_data.map(c => c.task_id)
      const { data: tasks_data, error: tasksError } =
        await supabase
          .from("tasks")
          .select("*")
          .in("id", taskIds)

      if (tasksError) throw tasksError

      // JOIN CLAIMS WITH TASKS
      const tasksMap = new Map(
        (tasks_data || []).map(t => [t.id, t])
      )

      const enrichedClaims = claims_data.map(claim => ({
        ...claim,
        tasks: tasksMap.get(claim.task_id) || null
      }))

      setClaims(enrichedClaims)

    } catch (error) {

      console.error("Error fetching claims:", error)
      setClaims([])

    }

    setLoading(false)
  }

  // =========================================
  // SUBMIT TASK
  // =========================================

  const handleSubmit = async (
    claimId: string,
    taskId: string
  ) => {

    const proof =
      prompt(
        "Enter submission/proof link"
      )

    if (!proof) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    // CREATE SUBMISSION
    const {
      error: submissionError,
    } = await supabase
      .from(
        "task_submissions"
      )
      .insert({
        claim_id: claimId,
        task_id: taskId,
        user_id: user.id,
        submission_link:
          proof,
        status: "pending",
      })

    if (submissionError) {

      alert(
        submissionError.message
      )

      return
    }

    // UPDATE CLAIM
    const { error } =
      await supabase
        .from(
          "task_claims"
        )
        .update({
          submitted: true,
          submission_link:
            proof,
          status:
            "pending_review",
        })
        .eq("id", claimId)

    if (error) {

      alert(error.message)

      return
    }

    alert(
      "Task submitted successfully"
    )

    fetchClaims()
  }

  // =========================================
  // TIMER
  // =========================================

  const getRemaining = (
    expires: string
  ) => {

    const diff =
      new Date(
        expires
      ).getTime() - Date.now()

    if (diff <= 0)
      return "Expired"

    const mins =
      Math.floor(
        diff /
          1000 /
          60
      )

    const secs =
      Math.floor(
        (diff / 1000) %
          60
      )

    return `${mins}m ${secs}s`
  }

  // =========================================
  // GROUPS
  // =========================================

  const active =
    claims.filter(
      (c) =>
        c.status ===
        "active"
    )

  const pending =
    claims.filter(
      (c) =>
        c.status ===
          "pending_review" ||
        c.status ===
          "submitted"
    )

  const approved =
    claims.filter(
      (c) =>
        c.status ===
        "approved"
    )

  const rejected =
    claims.filter(
      (c) =>
        c.status ===
        "rejected"
    )

  // =========================================
  // ACTIVE ITEMS
  // =========================================

  const activeItems =
    useMemo(() => {

      switch (
        activeTab
      ) {

        case "pending":
          return pending

        case "approved":
          return approved

        case "rejected":
          return rejected

        default:
          return active
      }

    }, [
      activeTab,
      active,
      pending,
      approved,
      rejected,
    ])

  // =========================================
  // PAGINATION
  // =========================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        activeItems.length /
          ITEMS_PER_PAGE
      )
    )

  const paginatedItems =
    activeItems.slice(
      (page - 1) *
        ITEMS_PER_PAGE,

      page *
        ITEMS_PER_PAGE
    )

  useEffect(() => {

    setPage(1)

  }, [activeTab])

  return (

    <div className="
      max-w-6xl
      mx-auto
      p-6
      md:p-8
      w-full
      font-sans
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
        className="mb-8"
      >

        <h1 className="
          text-3xl
          font-bold
          text-white
          tracking-tight
        ">
          My Tasks
        </h1>

        <p className="
          text-slate-400
          mt-2
          text-sm
        ">
          Manage your tasks and track progress.
        </p>

      </motion.div>

      {/* TABS */}
      <div className="
        grid
        grid-cols-2
        md:grid-cols-4
        gap-4
        mb-8
      ">

        <TabCard
          title="Active"
          count={active.length}
          active={
            activeTab ===
            "active"
          }
          onClick={() =>
            setActiveTab(
              "active"
            )
          }
        />

        <TabCard
          title="Pending"
          count={pending.length}
          active={
            activeTab ===
            "pending"
          }
          onClick={() =>
            setActiveTab(
              "pending"
            )
          }
        />

        <TabCard
          title="Approved"
          count={approved.length}
          active={
            activeTab ===
            "approved"
          }
          onClick={() =>
            setActiveTab(
              "approved"
            )
          }
        />

        <TabCard
          title="Rejected"
          count={rejected.length}
          active={
            activeTab ===
            "rejected"
          }
          onClick={() =>
            setActiveTab(
              "rejected"
            )
          }
        />

      </div>

      {/* LOADING */}
      {loading && (

        <div className="
          text-slate-400
        ">
          Loading tasks...
        </div>
      )}

      {/* EMPTY */}
      {!loading &&
        activeItems.length ===
          0 && (

        <div className="
          border
          border-white/5
          bg-white/[0.02]
          rounded-2xl
          p-10
          text-center
        ">

          <h3 className="
            text-xl
            font-semibold
            text-white
          ">
            No Tasks Found
          </h3>

        </div>
      )}

      {/* TASKS */}
      <div className="
        space-y-5
      ">

        {paginatedItems.map(
          (claim) => {

            const task =
              claim.tasks

            const isComment =
              task.task_type ===
              "comment"

            return (

              <motion.div
                key={claim.id}
                initial={{
                  opacity: 0,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="
                  border
                  border-white/5
                  bg-white/[0.02]
                  backdrop-blur-xl
                  rounded-3xl
                  p-7
                  shadow-2xl
                  shadow-black/20
                "
              >

                {/* TOP */}
                <div className="
                  flex
                  flex-col
                  lg:flex-row
                  lg:justify-between
                  lg:items-start
                  gap-6
                  mb-8
                ">

                  {/* LEFT */}
                  <div className="
                    flex-1
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
                      mb-5
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
                          claim.task_id}
                      </span>

                    </div>

                    {/* TYPE */}
                    <p className="
                      text-xs
                      uppercase
                      tracking-[0.2em]
                      text-slate-500
                      mb-3
                    ">

                      {isComment
                        ? "Comment Task"
                        : "Post Task"}

                    </p>

                    {/* TITLE */}
                    <h2 className="
                      text-3xl
                      font-bold
                      text-white
                    ">

                      {isComment
                        ? task.comment_type ||
                          "Comment Task"
                        : task.title ||
                          "Post Task"}

                    </h2>

                  </div>

                  {/* RIGHT */}
                  <div className="
                    text-left
                    lg:text-right
                  ">

                    <div className="
                      text-4xl
                      font-bold
                      text-green-400
                    ">
                      ${task.reward}
                    </div>

                    {claim.status ===
                      "active" && (

                      <div className="
                        mt-3
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
                        text-sm
                      ">

                        <Clock
                          size={14}
                        />

                        {getRemaining(
                          claim.expires_at
                        )}

                      </div>
                    )}

                  </div>

                </div>

                {/* CONTENT */}
                <div className="
                  space-y-6
                ">

                  {/* COMMENT TASK */}
                  {isComment && (

                    <>

                      {task.post_link && (

                        <a
                          href={
                            task.post_link
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="
                            inline-flex
                            items-center
                            gap-4
                            px-5
                            py-4
                            rounded-2xl
                            bg-blue-500/10
                            border
                            border-blue-500/20
                            hover:border-blue-500/40
                            transition-all
                          "
                        >

                          <div className="
                            w-10
                            h-10
                            rounded-full
                            bg-[#FF4500]
                            flex
                            items-center
                            justify-center
                            text-white
                            font-bold
                          ">
                            r
                          </div>

                          <div>

                            <p className="
                              text-white
                              font-semibold
                            ">
                              Open Reddit Post
                            </p>

                            <p className="
                              text-slate-400
                              text-sm
                            ">
                              View target thread
                            </p>

                          </div>

                        </a>
                      )}

                      <div className="
                        rounded-2xl
                        bg-white/[0.03]
                        border
                        border-white/5
                        p-5
                        text-slate-300
                        leading-relaxed
                        whitespace-pre-wrap
                      ">

                        {task.body}

                      </div>

                    </>
                  )}

                  {/* POST TASK */}
                  {!isComment && (

                    <>

                      {task.subreddit && (

                        <a
                          href={
                            task.subreddit.startsWith("http")
                              ? task.subreddit
                              : `https://reddit.com/${task.subreddit}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="
                            inline-flex
                            items-center
                            gap-4
                            px-5
                            py-4
                            rounded-2xl
                            bg-orange-500/10
                            border
                            border-orange-500/20
                            hover:border-orange-500/40
                            transition-all
                          "
                        >

                          <div className="
                            w-10
                            h-10
                            rounded-full
                            bg-[#FF4500]
                            flex
                            items-center
                            justify-center
                            text-white
                            font-bold
                          ">
                            r
                          </div>

                          <div>

                            <p className="
                              text-white
                              font-semibold
                            ">
                              {task.subreddit}
                            </p>

                            <p className="
                              text-slate-400
                              text-sm
                            ">
                              Open subreddit
                            </p>

                          </div>

                        </a>
                      )}

                      <div className="
                        rounded-2xl
                        bg-white/[0.03]
                        border
                        border-white/5
                        p-5
                        text-slate-300
                        leading-relaxed
                        whitespace-pre-wrap
                      ">

                        {task.body}

                      </div>

                    </>
                  )}

                </div>

                {/* STATUS */}
                {claim.status ===
                  "pending_review" && (

                  <div className="
                    mt-6
                    bg-yellow-500/10
                    border
                    border-yellow-500/20
                    text-yellow-300
                    rounded-2xl
                    p-4
                    text-sm
                  ">

                    Submission under review

                  </div>
                )}

                {claim.status ===
                  "approved" && (

                  <div className="
                    mt-6
                    bg-green-500/10
                    border
                    border-green-500/20
                    text-green-300
                    rounded-2xl
                    p-4
                    text-sm
                    flex
                    items-center
                    gap-2
                  ">

                    <CheckCircle
                      size={16}
                    />

                    Approved

                  </div>
                )}

                {claim.status ===
                  "rejected" && (

                  <div className="
                    mt-6
                    bg-red-500/10
                    border
                    border-red-500/20
                    text-red-300
                    rounded-2xl
                    p-4
                    text-sm
                  ">

                    <div className="
                      flex
                      items-center
                      gap-2
                      mb-2
                    ">

                      <XCircle
                        size={16}
                      />

                      Rejected

                    </div>

                    {task?.rejection_reason && (

                      <p className="
                        text-xs
                        text-red-200
                        ml-6
                      ">

                        Reason: {task.rejection_reason}

                      </p>
                    )}

                  </div>
                )}

                {/* SUBMIT */}
                {claim.status ===
                  "active" && (

                  <button
                    onClick={() =>
                      handleSubmit(
                        claim.id,
                        task.id
                      )
                    }
                    className="
                      mt-8
                      w-full
                      bg-green-500
                      hover:bg-green-600
                      transition-all
                      rounded-2xl
                      py-4
                      font-semibold
                      text-white
                      shadow-lg
                      shadow-green-500/20
                    "
                  >
                    Submit Task
                  </button>
                )}

              </motion.div>
            )
          }
        )}

      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (

        <div className="
          flex
          items-center
          justify-center
          gap-4
          mt-10
        ">

          <button
            onClick={() =>
              setPage((p) =>
                Math.max(
                  1,
                  p - 1
                )
              )
            }
            disabled={page === 1}
            className="
              w-11
              h-11
              rounded-xl
              bg-white/5
              border
              border-white/10
              flex
              items-center
              justify-center
              text-slate-300
              disabled:opacity-40
            "
          >

            <ChevronLeft
              size={18}
            />

          </button>

          <div className="
            px-5
            py-2
            rounded-xl
            bg-white/5
            border
            border-white/10
            text-slate-300
          ">

            {page} / {totalPages}

          </div>

          <button
            onClick={() =>
              setPage((p) =>
                Math.min(
                  totalPages,
                  p + 1
                )
              )
            }
            disabled={
              page ===
              totalPages
            }
            className="
              w-11
              h-11
              rounded-xl
              bg-white/5
              border
              border-white/10
              flex
              items-center
              justify-center
              text-slate-300
              disabled:opacity-40
            "
          >

            <ChevronRight
              size={18}
            />

          </button>

        </div>
      )}

    </div>
  )
}

// =========================================
// TAB
// =========================================

function TabCard({
  title,
  count,
  active,
  onClick,
}: any) {

  return (

    <button
      onClick={onClick}
      className={`
        rounded-2xl
        p-5
        border
        transition-all
        text-left

        ${
          active
            ? "bg-red-500/10 border-red-500/30"
            : "bg-white/[0.02] border-white/10"
        }
      `}
    >

      <p className="
        text-sm
        text-slate-400
      ">
        {title}
      </p>

      <p className="
        text-3xl
        font-bold
        text-white
        mt-2
      ">
        {count}
      </p>

    </button>
  )
}