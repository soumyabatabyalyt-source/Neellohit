"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import { supabase } from "@/lib/supabaseClient"

import ReviewActions from "./ReviewActions"

import {
  motion,
  AnimatePresence,
} from "framer-motion"

import {
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  User as UserIcon,
  Hash,
  ChevronLeft,
  ChevronRight,
  Database,
} from "lucide-react"

type SubmissionRow = {
  id: string

  claim_id: string

  user_id: string

  task_id: string

  status:
    | "pending"
    | "pending_review"
    | "approved"
    | "rejected"
    | "submitted"

  submission_link: string | null

  created_at: string | null

  profile?: {
    email?: string | null
    reddit?: string | null
  } | null

  task?: {
    task_code?: string | null

    title?: string | null

    reward?: number | string | null

    task_type?: string | null

    comment_type?: string | null

    subreddit?: string | null

    post_link?: string | null
  } | null
}

type TabType =
  | "pending"
  | "approved"
  | "rejected"

const ITEMS_PER_PAGE = 20

export default function SubmissionsPage() {

  const [submissions, setSubmissions] =
    useState<SubmissionRow[]>([])

  const [loading, setLoading] =
    useState(true)

  const [errorMsg, setErrorMsg] =
    useState("")

  const [activeTab, setActiveTab] =
    useState<TabType>("pending")

  const [page, setPage] =
    useState(1)

  // =========================================
  // LOAD SUBMISSIONS
  // =========================================

  const loadSubmissions =
    useCallback(async () => {

      setLoading(true)

      setErrorMsg("")

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {

        setErrorMsg(
          "Login required"
        )

        setLoading(false)

        return
      }

      const res = await fetch(
        "/api/manager-submissions",
        {
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        }
      )

      const payload =
        await res.json()

      if (!res.ok) {

        setErrorMsg(
          payload.error ||
          "Error loading submissions"
        )

        setSubmissions([])

      } else {

        setSubmissions(
          payload.submissions || []
        )
      }

      setLoading(false)

    }, [])

  useEffect(() => {

    const timeout =
      window.setTimeout(() => {

        void loadSubmissions()

      }, 0)

    return () =>
      window.clearTimeout(timeout)

  }, [loadSubmissions])

  // RESET PAGE
  useEffect(() => {

    setPage(1)

  }, [activeTab])

  // =========================================
  // FILTERS
  // =========================================

  const pending =
    submissions.filter(
      (item) =>
        item.status ===
          "pending" ||
        item.status ===
          "pending_review" ||
        item.status ===
          "submitted"
    )

  const approved =
    submissions.filter(
      (item) =>
        item.status ===
        "approved"
    )

  const rejected =
    submissions.filter(
      (item) =>
        item.status ===
        "rejected"
    )

  // =========================================
  // ACTIVE ITEMS
  // =========================================

  const activeItems =
    useMemo(() => {

      switch (activeTab) {

        case "approved":
          return approved

        case "rejected":
          return rejected

        default:
          return pending
      }

    }, [
      activeTab,
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

  // =========================================
  // LOADING
  // =========================================

  if (loading) {

    return (

      <div className="
        p-6
        md:p-10
        flex
        flex-col
        items-center
        justify-center
        min-h-[50vh]
        text-slate-400
      ">

        <Loader2
          className="
            animate-spin
            mb-4
            text-red-500
          "
          size={32}
        />

        <p className="
          animate-pulse
          font-medium
        ">
          Loading submissions...
        </p>

      </div>
    )
  }

  // =========================================
  // ERROR
  // =========================================

  if (errorMsg) {

    return (

      <div className="
        p-6
        md:p-10
      ">

        <div className="
          bg-red-500/10
          border
          border-red-500/20
          text-red-400
          p-4
          rounded-xl
          flex
          items-center
          gap-3
        ">

          <XCircle size={20} />

          <p className="
            font-medium
          ">
            {errorMsg}
          </p>

        </div>

      </div>
    )
  }

  return (

    <div className="
      p-6
      md:p-10
      max-w-7xl
      mx-auto
      w-full
      space-y-8
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
      >

        <div className="
          flex
          flex-col
          lg:flex-row
          lg:items-center
          lg:justify-between
          gap-4
        ">

          <div>

            <h1 className="
              text-3xl
              font-bold
              text-white
              tracking-tight
            ">
              Submissions
            </h1>

            <p className="
              text-slate-400
              mt-1
              text-sm
            ">
              Manage and review user task submissions.
            </p>

          </div>

          {/* TOTAL */}
          <div className="
            inline-flex
            items-center
            gap-3
            px-5
            py-3
            rounded-2xl
            bg-white/[0.03]
            border
            border-white/10
          ">

            <div className="
              w-11
              h-11
              rounded-xl
              bg-blue-500/10
              border
              border-blue-500/20
              flex
              items-center
              justify-center
              text-blue-400
            ">

              <Database size={20} />

            </div>

            <div>

              <p className="
                text-xs
                uppercase
                tracking-wider
                text-slate-500
              ">
                Total Tasks Ever Created
              </p>

              <p className="
                text-2xl
                font-bold
                text-white
              ">
                {submissions.length}
              </p>

            </div>

          </div>

        </div>

      </motion.div>

      {/* TABS */}
      <motion.div
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.1,
        }}
        className="
          grid
          grid-cols-1
          sm:grid-cols-3
          gap-4
        "
      >

        <TabCard
          title="Pending Review"
          count={pending.length}
          active={
            activeTab ===
            "pending"
          }
          color="amber"
          icon={
            <Clock size={24} />
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
          color="emerald"
          icon={
            <CheckCircle size={24} />
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
          color="rose"
          icon={
            <XCircle size={24} />
          }
          onClick={() =>
            setActiveTab(
              "rejected"
            )
          }
        />

      </motion.div>

      {/* PAGE INFO */}
      <div className="
        flex
        items-center
        justify-between
        flex-wrap
        gap-4
      ">

        <div className="
          text-sm
          text-slate-500
        ">

          Showing{" "}

          <span className="
            text-white
            font-medium
          ">
            {paginatedItems.length}
          </span>

          {" "}of{" "}

          <span className="
            text-white
            font-medium
          ">
            {activeItems.length}
          </span>

          {" "}entries

        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (

          <div className="
            flex
            items-center
            gap-3
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
                bg-white/[0.03]
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
              py-2.5
              rounded-xl
              bg-white/[0.03]
              border
              border-white/10
              text-sm
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
                bg-white/[0.03]
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

      {/* CONTENT */}
      <AnimatePresence
        mode="wait"
      >

        <motion.div
          key={activeTab}
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: -10,
          }}
          transition={{
            duration: 0.2,
          }}
          className="
            grid
            gap-4
          "
        >

          {paginatedItems.length === 0 ? (

            <div className="
              py-16
              border-2
              border-dashed
              border-white/5
              rounded-3xl
              text-center
              bg-white/[0.01]
            ">

              <p className="
                text-slate-400
                text-lg
                font-medium
              ">
                No submissions found
              </p>

            </div>

          ) : (

            paginatedItems.map(
              (item) => {

                const isComment =
                  item.task?.task_type ===
                  "comment"

                return (

                  <div
                    key={item.id}
                    className="
                      bg-white/[0.02]
                      border
                      border-white/10
                      hover:border-white/20
                      transition-colors
                      rounded-3xl
                      p-6
                      shadow-lg
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
                    ">

                      {/* LEFT */}
                      <div className="
                        flex-1
                        space-y-5
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
                            {item.task?.task_code ||
                              item.task_id}
                          </span>

                        </div>

                        {/* TYPE */}
                        <div>

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

                          <h2 className="
                            text-2xl
                            font-bold
                            text-white
                          ">

                            {isComment
                              ? item.task
                                  ?.comment_type ||
                                "Comment Task"
                              : item.task
                                  ?.title ||
                                "Post Task"}

                          </h2>

                          {item.task?.reward && (

                            <p className="
                              text-green-400
                              text-lg
                              font-semibold
                              mt-3
                            ">
                              ${item.task.reward}
                            </p>
                          )}

                        </div>

                        {/* REDDIT TARGET */}
                        {isComment &&
                          item.task
                            ?.post_link && (

                          <a
                            href={
                              item.task
                                .post_link
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

                        {!isComment &&
                          item.task
                            ?.subreddit && (

                          <a
                            href={
                              item.task.subreddit.startsWith(
                                "http"
                              )
                                ? item.task
                                    .subreddit
                                : `https://reddit.com/${item.task.subreddit}`
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
                                {item.task
                                  .subreddit}
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

                        {/* META */}
                        <div className="
                          grid
                          grid-cols-1
                          md:grid-cols-2
                          gap-4
                        ">

                          {/* EMAIL */}
                          <div className="
                            flex
                            items-center
                            gap-3
                            text-sm
                            text-slate-400
                          ">

                            <UserIcon
                              size={14}
                            />

                            <span className="
                              truncate
                            ">

                              {item.profile
                                ?.email ||
                                item.user_id}

                            </span>

                          </div>

                          {/* REDDIT */}
                          <div className="
                            flex
                            items-center
                            gap-3
                            text-sm
                            text-slate-400
                          ">

                            <span>
                              Reddit:
                            </span>

                            <span>

                              {item.profile
                                ?.reddit ||
                                "Not provided"}

                            </span>

                          </div>

                          {/* TIME */}
                          <div className="
                            flex
                            items-center
                            gap-3
                            text-sm
                            text-slate-400
                          ">

                            <Clock
                              size={14}
                            />

                            <span>

                              Submitted{" "}
                              {formatAge(
                                item.created_at
                              )}

                            </span>

                          </div>

                          {/* PROOF */}
                          <div>

                            {item.submission_link ? (

                              <a
                                href={
                                  item.submission_link
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="
                                  inline-flex
                                  items-center
                                  gap-2
                                  text-blue-400
                                  hover:text-blue-300
                                  transition-colors
                                  font-medium
                                  bg-blue-500/10
                                  px-4
                                  py-2
                                  rounded-xl
                                  border
                                  border-blue-500/20
                                "
                              >

                                View Proof

                                <ExternalLink
                                  size={13}
                                />

                              </a>

                            ) : (

                              <span className="
                                text-slate-500
                                italic
                                text-sm
                              ">
                                No proof link
                              </span>
                            )}

                          </div>

                        </div>

                      </div>

                      {/* RIGHT */}
                      <div className="
                        shrink-0
                        flex
                        items-center
                        lg:justify-end
                        border-t
                        border-white/5
                        pt-5
                        lg:pt-0
                        lg:border-t-0
                        lg:pl-6
                        lg:border-l
                      ">

                        {activeTab ===
                        "pending" ? (

                          <ReviewActions
                            claimId={
                              item.claim_id
                            }
                            onReviewed={
                              loadSubmissions
                            }
                          />

                        ) : (

                          <div className={`px-5 py-3 rounded-2xl text-sm font-semibold capitalize border ${
                            item.status ===
                            "approved"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}>

                            {item.status}

                          </div>
                        )}

                      </div>

                    </div>

                  </div>
                )
              }
            )
          )}

        </motion.div>

      </AnimatePresence>

    </div>
  )
}

// =========================================
// TAB CARD
// =========================================

function TabCard({
  title,
  count,
  active,
  color,
  icon,
  onClick,
}: any) {

  const styles = {
    amber: active
      ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
      : "bg-white/[0.02] border-white/10",

    emerald: active
      ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
      : "bg-white/[0.02] border-white/10",

    rose: active
      ? "bg-rose-500/10 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
      : "bg-white/[0.02] border-white/10",
  }

  return (

    <button
      onClick={onClick}
      className={`relative text-left rounded-2xl p-5 flex items-center justify-between transition-all duration-300 outline-none border hover:border-white/20 ${styles[color as keyof typeof styles]}`}
    >

      <div>

        <p className="
          text-sm
          font-medium
          mb-1
          text-slate-400
        ">
          {title}
        </p>

        <p className="
          text-3xl
          font-bold
          text-white
        ">
          {count}
        </p>

      </div>

      <div className="
        w-12
        h-12
        rounded-full
        flex
        items-center
        justify-center
        bg-white/5
        text-slate-400
      ">

        {icon}

      </div>

    </button>
  )
}

// =========================================
// TIME FORMAT
// =========================================

function formatAge(
  value: string | null
) {

  if (!value)
    return "Unknown"

  const seconds =
    Math.max(
      0,
      Math.floor(
        (
          Date.now() -
          new Date(
            value
          ).getTime()
        ) / 1000
      )
    )

  const days =
    Math.floor(
      seconds / 86400
    )

  const hours =
    Math.floor(
      (seconds % 86400) /
        3600
    )

  const minutes =
    Math.floor(
      (seconds % 3600) /
        60
    )

  if (days > 0)
    return `${days}d ${hours}h ago`

  if (hours > 0)
    return `${hours}h ${minutes}m ago`

  return `${minutes}m ago`
}