"use client"

import {
  useEffect,
  useState,
} from "react"

import { motion } from "framer-motion"

import { supabase } from "@/lib/supabaseClient"

import {
  CheckCircle,
  XCircle,
  Edit2,
  AlertCircle,
} from "lucide-react"

type DraftTask = {
  id: string
  task_code?: string
  title?: string
  task_type?: string
  body?: string
  reward?: number
  time_limit?: number
  subreddit?: string
  comment_type?: string
  post_link?: string
  created_at?: string
}

const REJECTION_REASONS = [
  "Filtered",
  "Mod Removed",
  "Low Quality",
  "Rule Violation",
  "Duplicate",
  "Incomplete",
  "Other",
]

export default function
  DraftTasksPage() {

  const [tasks, setTasks] =
    useState<DraftTask[]>([])

  const [loading, setLoading] =
    useState(true)

  const [editingId, setEditingId] =
    useState<string | null>(null)

  const [editData, setEditData] =
    useState<Partial<DraftTask>>({})

  const [rejectingId, setRejectingId] =
    useState<string | null>(null)

  const [
    rejectReason,
    setRejectReason,
  ] = useState("")

  const [customReason, setCustomReason] =
    useState("")

  // =========================================
  // FETCH DRAFTS
  // =========================================

  const fetchDrafts =
    async () => {

      try {

        setLoading(true)

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          return
        }

        const token =
          session.access_token

        const response =
          await fetch(
            "/api/manager/draft-tasks",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          )

        const json =
          await response.json()

        if (!response.ok) {
          throw new Error(
            json.error ||
              "Failed to load drafts"
          )
        }

        setTasks(json.tasks || [])

      } catch (error) {

        console.error(error)

        alert(
          error instanceof Error
            ? error.message
            : "Failed to load drafts"
        )

      } finally {

        setLoading(false)
      }
    }

  useEffect(() => {

    fetchDrafts()

  }, [])

  // =========================================
  // PUBLISH TASK
  // =========================================

  const publishTask =
    async (taskId: string) => {

      try {

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          return
        }

        const response =
          await fetch(
            "/api/manager/draft-tasks",
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                taskId,
                action: "publish",
              }),
            }
          )

        const json =
          await response.json()

        if (!response.ok) {
          throw new Error(
            json.error ||
              "Failed to publish"
          )
        }

        alert("Task published! ✅")

        await fetchDrafts()

      } catch (error) {

        console.error(error)

        alert(
          error instanceof Error
            ? error.message
            : "Failed to publish task"
        )
      }
    }

  // =========================================
  // REJECT TASK
  // =========================================

  const rejectTask =
    async (taskId: string) => {

      if (!rejectReason) {
        alert(
          "Please select a reason"
        )
        return
      }

      const finalReason =
        rejectReason === "Other"
          ? customReason
          : rejectReason

      if (!finalReason) {
        alert(
          "Please provide a reason"
        )
        return
      }

      try {

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          return
        }

        const response =
          await fetch(
            "/api/manager/draft-tasks",
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                taskId,
                action: "reject",
                rejectionReason:
                  finalReason,
              }),
            }
          )

        const json =
          await response.json()

        if (!response.ok) {
          throw new Error(
            json.error ||
              "Failed to reject"
          )
        }

        alert("Task rejected ✅")

        setRejectingId(null)

        setRejectReason("")

        setCustomReason("")

        await fetchDrafts()

      } catch (error) {

        console.error(error)

        alert(
          error instanceof Error
            ? error.message
            : "Failed to reject task"
        )
      }
    }

  // =========================================
  // SAVE EDIT
  // =========================================

  const saveEdit =
    async (taskId: string) => {

      try {

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          return
        }

        const response =
          await fetch(
            "/api/manager/draft-tasks",
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                taskId,
                action: "edit",
                taskData: editData,
              }),
            }
          )

        const json =
          await response.json()

        if (!response.ok) {
          throw new Error(
            json.error ||
              "Failed to save"
          )
        }

        alert("Task updated! ✅")

        setEditingId(null)

        setEditData({})

        await fetchDrafts()

      } catch (error) {

        console.error(error)

        alert(
          error instanceof Error
            ? error.message
            : "Failed to save task"
        )
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
          space-y-4
        ">

          {[1, 2, 3].map(
            (i) => (

              <div
                key={i}
                className="
                  border-2
                  border-white/15
                  bg-white/[0.03]
                  rounded-2xl
                  p-6
                  h-32
                  animate-pulse
                "
              />
            )
          )}

        </div>

      </div>
    )
  }

  // =========================================
  // EMPTY STATE
  // =========================================

  if (tasks.length === 0) {

    return (

      <div className="
        max-w-6xl
        mx-auto
        p-6
      ">

        <h1 className="
          text-3xl
          font-bold
          text-white
          mb-8
        ">
          Draft Tasks
        </h1>

        <div className="
          border-2
          border-dashed
          border-white/15
          rounded-2xl
          p-12
          text-center
          bg-white/[0.01]
        ">

          <AlertCircle
            size={48}
            className="
              mx-auto
              mb-4
              text-slate-500
            "
          />

          <h2 className="
            text-xl
            font-semibold
            text-white
            mb-2
          ">
            No Draft Tasks
          </h2>

          <p className="
            text-slate-400
          ">
            All tasks have been
            reviewed
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
      p-6
      md:p-8
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
          Draft Tasks
        </h1>

        <p className="
          text-slate-400
          mt-2
        ">
          Review and publish
          tasks from imports
        </p>

      </motion.div>

      {/* INFO */}

      <div className="
        mb-8
        p-4
        rounded-xl
        border-2
        border-blue-500/30
        bg-blue-500/10
        text-blue-300
        text-sm
      ">

        💡 Review each task
        details. Publish to
        make available to
        users, or reject with
        a reason.

      </div>

      {/* TASKS */}

      <div className="
        space-y-5
      ">

        {tasks.map((task) => {

          const isEditing =
            editingId === task.id

          const isRejecting =
            rejectingId ===
            task.id

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
                border-2
                border-white/15
                bg-white/[0.03]
                hover:bg-white/[0.05]
                hover:border-white/25
                rounded-2xl
                p-6
                transition-all duration-300
                shadow-lg
                backdrop-blur-sm
              "
            >

              {/* MAIN CONTENT */}

              {!isRejecting && (

                <>

                  {/* HEADER */}

                  <div className="
                    flex
                    justify-between
                    items-start
                    mb-6
                  ">

                    <div className="
                      flex-1
                    ">

                      <div className="
                        text-xs
                        uppercase
                        text-slate-500
                        mb-2
                      ">

                        Task ID

                      </div>

                      {isEditing ? (

                        <input
                          type="text"
                          value={
                            editData
                              .task_code ||
                            task
                              .task_code ||
                            ""
                          }
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              task_code:
                                e.target
                                  .value,
                            })
                          }
                          className="
                            w-full
                            max-w-xs
                            px-3
                            py-2
                            rounded-lg
                            bg-white/[0.03]
                            border-2
                            border-white/15
                            focus:border-blue-500/50
                            focus:bg-white/[0.05]
                            text-white
                            text-sm
                            mb-4
                            transition-all
                          "
                        />

                      ) : (

                        <h2 className="
                          text-2xl
                          font-bold
                          text-white
                        ">

                          {task
                            .task_code}

                        </h2>
                      )}

                      <p className="
                        text-sm
                        text-slate-400
                        mt-1
                      ">

                        Created:
                        {new Date(
                          task
                            .created_at ||
                          ""
                        ).toLocaleDateString()}

                      </p>

                    </div>

                    {!isEditing && (

                      <button
                        onClick={() => {
                          setEditingId(
                            task.id
                          )

                          setEditData({})
                        }}
                        className="
                          p-2
                          rounded-lg
                          bg-white/5
                          hover:bg-white/10
                          transition-all
                          text-slate-400
                        "
                      >

                        <Edit2
                          size={18}
                        />

                      </button>
                    )}

                  </div>

                  {/* DETAILS */}

                  <div className="
                    space-y-4
                    mb-6
                  ">

                    <DetailField
                      label="Title"
                      value={
                        task.title
                      }
                      isEditing={
                        isEditing
                      }
                      onChange={(val: string) =>
                        setEditData({
                          ...editData,
                          title: val,
                        })
                      }
                    />

                    <DetailField
                      label="Reward"
                      value={
                        `$${task.reward}`
                      }
                      isEditing={
                        isEditing
                      }
                      onChange={(val: string) =>
                        setEditData({
                          ...editData,
                          reward: parseFloat(
                            val
                          ),
                        })
                      }
                    />

                    <DetailField
                      label="Time Limit"
                      value={
                        `${task.time_limit} mins`
                      }
                      isEditing={
                        isEditing
                      }
                      onChange={(val: string) =>
                        setEditData({
                          ...editData,
                          time_limit:
                            parseInt(val),
                        })
                      }
                    />

                  </div>

                  {/* BODY */}

                  <div className="
                    mb-6
                    p-4
                    rounded-xl
                    bg-white/[0.03]
                    border-2
                    border-white/15
                  ">

                    <p className="
                      text-xs
                      uppercase
                      text-slate-500
                      mb-2
                    ">

                      Description

                    </p>

                    {isEditing ? (

                      <textarea
                        value={
                          editData
                            .body ||
                          task.body ||
                          ""
                        }
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            body: e
                              .target
                              .value,
                          })
                        }
                        className="
                          w-full
                          p-3
                          rounded-lg
                          bg-white/[0.03]
                          border-2
                          border-white/15
                          text-white
                          text-sm
                          min-h-[100px]
                          focus:bg-white/[0.05]
                          focus:border-blue-500/50
                          transition-all
                        "
                      />

                    ) : (

                      <p className="
                        text-slate-300
                        text-sm
                        whitespace-pre-wrap
                      ">

                        {task.body}

                      </p>
                    )}

                  </div>

                  {/* ACTIONS */}

                  <div className="
                    flex
                    gap-3
                    flex-wrap
                  ">

                    {isEditing ? (

                      <>

                        <button
                          onClick={() =>
                            saveEdit(
                              task.id
                            )
                          }
                          className="
                            flex-1
                            px-6
                            py-3
                            rounded-xl
                            bg-green-500
                            hover:bg-green-600
                            transition-all
                            font-semibold
                            text-white
                          "
                        >

                          Save Changes

                        </button>

                        <button
                          onClick={() =>
                            setEditingId(
                              null
                            )
                          }
                          className="
                            px-6
                            py-3
                            rounded-xl
                            bg-white/5
                            hover:bg-white/10
                            transition-all
                            font-semibold
                            text-white
                          "
                        >

                          Cancel

                        </button>

                      </>

                    ) : (

                      <>

                        <button
                          onClick={() =>
                            publishTask(
                              task.id
                            )
                          }
                          className="
                            flex-1
                            flex
                            items-center
                            justify-center
                            gap-2
                            px-6
                            py-3
                            rounded-xl
                            bg-gradient-to-r
                            from-green-500
                            to-green-600
                            hover:from-green-400
                            hover:to-green-500
                            transition-all
                            font-semibold
                            text-white
                          "
                        >

                          <CheckCircle
                            size={18}
                          />

                          Publish

                        </button>

                        <button
                          onClick={() =>
                            setRejectingId(
                              task.id
                            )
                          }
                          className="
                            flex-1
                            flex
                            items-center
                            justify-center
                            gap-2
                            px-6
                            py-3
                            rounded-xl
                            bg-red-500/10
                            hover:bg-red-500/20
                            border
                            border-red-500/30
                            transition-all
                            font-semibold
                            text-red-400
                          "
                        >

                          <XCircle
                            size={18}
                          />

                          Reject

                        </button>

                      </>
                    )}

                  </div>

                </>
              )}

              {/* REJECTION MODAL */}

              {isRejecting && (

                <div className="
                  space-y-4
                ">

                  <h3 className="
                    text-lg
                    font-semibold
                    text-white
                  ">

                    Reject Task

                  </h3>

                  <p className="
                    text-sm
                    text-slate-400
                  ">

                    {task.task_code}

                  </p>

                  {/* REASON SELECT */}

                  <div>

                    <label className="
                      block
                      text-sm
                      text-slate-400
                      mb-2
                    ">

                      Select Reason

                    </label>

                    <select
                      value={
                        rejectReason
                      }
                      onChange={(e) =>
                        setRejectReason(
                          e.target
                            .value
                        )
                      }
                      className="
                        w-full
                        px-4
                        py-2
                        rounded-lg
                        bg-white/[0.03]
                        border-2
                        border-white/15
                        text-white
                        focus:outline-none
                        focus:bg-white/[0.05]
                        focus:border-red-500/50
                        transition-all
                      "
                    >

                      <option value="">
                        Choose a reason...
                      </option>

                      {REJECTION_REASONS.map(
                        (reason) => (

                          <option
                            key={reason}
                            value={reason}
                          >

                            {reason}

                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* CUSTOM REASON */}

                  {rejectReason ===
                    "Other" && (

                    <div>

                      <label className="
                        block
                        text-sm
                        text-slate-400
                        mb-2
                      ">

                        Custom Reason

                      </label>

                      <textarea
                        value={
                          customReason
                        }
                        onChange={(e) =>
                          setCustomReason(
                            e.target
                              .value
                          )
                        }
                        placeholder="Explain why this task is being rejected..."
                        className="
                          w-full
                          px-4
                          py-2
                          rounded-lg
                          bg-white/[0.03]
                          border-2
                          border-white/15
                          text-white
                          placeholder:text-slate-500
                          focus:outline-none
                          focus:bg-white/[0.05]
                          focus:border-red-500/50
                          transition-all
                          min-h-[80px]
                        "
                      />

                    </div>
                  )}

                  {/* ACTIONS */}

                  <div className="
                    flex
                    gap-3
                  ">

                    <button
                      onClick={() =>
                        rejectTask(
                          task.id
                        )
                      }
                      className="
                        flex-1
                        px-6
                        py-3
                        rounded-xl
                        bg-red-500
                        hover:bg-red-600
                        transition-all
                        font-semibold
                        text-white
                      "
                    >

                      Confirm Reject

                    </button>

                    <button
                      onClick={() => {
                        setRejectingId(
                          null
                        )

                        setRejectReason(
                          ""
                        )

                        setCustomReason(
                          ""
                        )
                      }}
                      className="
                        flex-1
                        px-6
                        py-3
                        rounded-xl
                        bg-white/5
                        hover:bg-white/10
                        transition-all
                        font-semibold
                        text-white
                      "
                    >

                      Cancel

                    </button>

                  </div>

                </div>
              )}

            </motion.div>
          )
        })}

      </div>

    </div>
  )
}

// =========================================
// DETAIL FIELD COMPONENT
// =========================================

function DetailField({
  label,
  value,
  isEditing,
  onChange,
}: any) {

  if (isEditing) {

    return (

      <div>

        <label className="
          block
          text-xs
          uppercase
          text-slate-500
          mb-2
        ">

          {label}

        </label>

        <input
          type="text"
          value={value || ""}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          className="
            w-full
            px-3
            py-2
            rounded-lg
            bg-white/[0.03]
            border-2
            border-white/15
            text-white
            text-sm
            focus:bg-white/[0.05]
            focus:border-blue-500/50
            transition-all
          "
        />

      </div>
    )
  }

  return (

    <div className="
      flex
      justify-between
      items-center
      pb-3
      border-b
      border-white/5
    ">

      <span className="
        text-slate-500
        text-sm
      ">

        {label}

      </span>

      <span className="
        text-white
        font-medium
        text-sm
      ">

        {value}

      </span>

    </div>
  )
}
