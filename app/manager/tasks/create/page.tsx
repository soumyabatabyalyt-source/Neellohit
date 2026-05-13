"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function CreateTaskPage() {

  const [activeTab, setActiveTab] =
    useState("drafts")

  const [loading, setLoading] =
    useState(false)

  const [importing, setImporting] =
    useState(false)

  const [publishingAll, setPublishingAll] =
    useState(false)

  const [drafts, setDrafts] =
    useState<any[]>([])

  const [importMessage, setImportMessage] =
    useState("")

  const [taskType, setTaskType] =
    useState("post")

  // =========================================
  // TASK ID SYSTEM
  // =========================================

  const [clientCode, setClientCode] =
    useState("A")

  const [taskNumber, setTaskNumber] =
    useState("1001")

  // =========================================
  // FORM FIELDS
  // =========================================

  const [subreddit, setSubreddit] =
    useState("")

  const [title, setTitle] =
    useState("")

  const [body, setBody] =
    useState("")

  const [reward, setReward] =
    useState("")

  const [timeLimit, setTimeLimit] =
    useState("30")

  const [commentType, setCommentType] =
    useState("comment")

  // =========================================
  // TYPE NUMBER
  // =========================================

  const typeNumber =
    useMemo(() => {

      if (
        taskType === "post"
      ) return "1"

      if (
        commentType ===
        "comment"
      ) return "2"

      if (
        commentType ===
        "reply"
      ) return "3"

      return "0"

    }, [
      taskType,
      commentType
    ])

  // =========================================
  // GENERATED TASK ID
  // =========================================

  const generatedTaskId =
    `${clientCode}-${typeNumber}-${taskNumber}`

  // =========================================
  // FETCH DRAFTS
  // =========================================

  async function fetchDrafts() {

    const { data } =
      await supabase
        .from("tasks")
        .select("*")
        .eq("draft", true)
        .order(
          "created_at",
          {
            ascending: false
          }
        )

    setDrafts(data || [])
  }

  useEffect(() => {
    fetchDrafts()
  }, [])

  // =========================================
  // IMPORT TASKS
  // =========================================

  async function handleImportTasks() {

    try {

      setImporting(true)

      setImportMessage("")

      const res =
        await fetch(
          "http://localhost:5000/api/sync-tasks"
        )

      const data =
        await res.json()

      if (!data.success) {

        setImportMessage(
          "Import failed"
        )

        return
      }

      setImportMessage(
        `${data.synced} tasks imported`
      )

      fetchDrafts()

    } catch (err) {

      console.error(err)

      setImportMessage(
        "Server error"
      )

    } finally {

      setImporting(false)
    }
  }

  // =========================================
  // CREATE TASK
  // =========================================

  async function handleCreateTask() {

    try {

      setLoading(true)

      const payload = {

        title,

        description:
          body,

        platform:
          "reddit",

        reward:
          Number(reward),

        status:
          "draft",

        draft: true,

        source:
          "manual",

        task_type:
          taskType,

        subreddit,

        body,

        comment_type:
          commentType,

        time_limit:
          Number(timeLimit),

        task_code:
          generatedTaskId
      }

      const { error } =
        await supabase
          .from("tasks")
          .insert([payload])

      if (error) {

        alert(error.message)

        return
      }

      alert(
        "Draft created"
      )

      setTitle("")
      setBody("")
      setSubreddit("")
      setReward("")

      setTaskNumber(
        (
          Number(taskNumber) + 1
        ).toString()
      )

      fetchDrafts()

    } catch (err) {

      console.error(err)

    } finally {

      setLoading(false)
    }
  }

  // =========================================
  // PUBLISH SINGLE
  // =========================================

  async function handlePublishDraft(
    id: string
  ) {

    await supabase
      .from("tasks")
      .update({
        draft: false,
        status: "open"
      })
      .eq("id", id)

    fetchDrafts()
  }

  // =========================================
  // DELETE DRAFT
  // =========================================

  async function handleDeleteDraft(
    id: string
  ) {

    const confirmed =
      confirm(
        "Delete this draft?"
      )

    if (!confirmed) return

    await supabase
      .from("tasks")
      .delete()
      .eq("id", id)

    fetchDrafts()
  }

  // =========================================
  // PUBLISH ALL
  // =========================================

  async function handlePublishAll() {

    try {

      setPublishingAll(true)

      await supabase
        .from("tasks")
        .update({
          draft: false,
          status: "open"
        })
        .eq("draft", true)

      fetchDrafts()

      alert(
        "All drafts published"
      )

    } catch (err) {

      console.error(err)

    } finally {

      setPublishingAll(false)
    }
  }

  return (

    <div className="
      min-h-screen
      bg-[#05070A]
      text-white
      p-4
      md:p-6
    ">

      <div className="
        max-w-7xl
        mx-auto
      ">

        {/* HEADER */}

        <div className="mb-8">

          <h1 className="
            text-3xl
            md:text-5xl
            font-bold
          ">
            Task Manager
          </h1>

          <p className="
            text-zinc-400
            mt-3
            text-sm
            md:text-base
          ">
            Manage manual tasks, imported tasks and drafts
          </p>

        </div>

        {/* TABS */}

        <div className="
          flex
          gap-3
          mb-8
          overflow-x-auto
          pb-2
        ">

          <TabButton
            active={
              activeTab ===
              "manual"
            }
            onClick={() =>
              setActiveTab(
                "manual"
              )
            }
          >
            Manual
          </TabButton>

          <TabButton
            active={
              activeTab ===
              "import"
            }
            onClick={() =>
              setActiveTab(
                "import"
              )
            }
          >
            Import
          </TabButton>

          <TabButton
            active={
              activeTab ===
              "drafts"
            }
            onClick={() =>
              setActiveTab(
                "drafts"
              )
            }
          >
            Drafts ({drafts.length})
          </TabButton>

        </div>

        {/* MANUAL */}

        {activeTab ===
          "manual" && (

          <div className="
            bg-white/[0.03]
            border
            border-white/10
            rounded-3xl
            p-5
            md:p-8
            space-y-5
          ">

            <div>

              <p className="
                text-sm
                text-zinc-500
              ">
                Generated Task ID
              </p>

              <h2 className="
                text-2xl
                md:text-4xl
                font-bold
                mt-2
              ">
                {generatedTaskId}
              </h2>

            </div>

            <div className="
              grid
              md:grid-cols-2
              gap-5
            ">

              <Input
                label="Client Code"
                value={clientCode}
                setValue={setClientCode}
                placeholder="A"
              />

              <Input
                label="Task Number"
                value={taskNumber}
                setValue={setTaskNumber}
                placeholder="1001"
              />

            </div>

            <Input
              label="Subreddit"
              value={subreddit}
              setValue={setSubreddit}
              placeholder="r/AskReddit"
            />

            <Input
              label="Post Title"
              value={title}
              setValue={setTitle}
              placeholder="Task title"
            />

            <Textarea
              label="Body"
              value={body}
              setValue={setBody}
              placeholder="Task body"
            />

            <div className="
              grid
              md:grid-cols-2
              gap-5
            ">

              <Input
                label="Reward ($)"
                value={reward}
                setValue={setReward}
                placeholder="50"
                type="number"
              />

              <Input
                label="Time Limit (minutes)"
                value={timeLimit}
                setValue={setTimeLimit}
                placeholder="30"
                type="number"
              />

            </div>

            <button
              onClick={
                handleCreateTask
              }
              disabled={loading}
              className="
                w-full
                bg-red-500
                hover:bg-red-600
                transition-all
                rounded-2xl
                p-4
                font-semibold
              "
            >

              {loading
                ? "Saving..."
                : "Save Draft"}

            </button>

          </div>
        )}

        {/* IMPORT */}

        {activeTab ===
          "import" && (

          <div className="
            bg-white/[0.03]
            border
            border-white/10
            rounded-3xl
            p-5
            md:p-8
          ">

            <h2 className="
              text-2xl
              font-bold
            ">
              Import Tasks
            </h2>

            <p className="
              text-zinc-400
              mt-2
              mb-6
            ">
              Import tasks directly from Google Sheets
            </p>

            <button
              onClick={
                handleImportTasks
              }
              disabled={importing}
              className="
                bg-white
                text-black
                px-6
                py-4
                rounded-2xl
                font-semibold
              "
            >

              {importing
                ? "Importing..."
                : "Import Tasks"}

            </button>

            {importMessage && (

              <div className="
                mt-6
                bg-black/40
                border
                border-white/10
                rounded-2xl
                p-4
                text-sm
              ">
                {importMessage}
              </div>
            )}

          </div>
        )}

        {/* DRAFTS */}

        {activeTab ===
          "drafts" && (

          <div>

            <div className="
              flex
              flex-col
              md:flex-row
              md:items-center
              md:justify-between
              gap-4
              mb-6
            ">

              <div>

                <h2 className="
                  text-3xl
                  font-bold
                ">
                  Draft Tasks
                </h2>

                <p className="
                  text-zinc-400
                  mt-2
                ">
                  Ready for publishing
                </p>

              </div>

              <button
                onClick={
                  handlePublishAll
                }
                disabled={publishingAll}
                className="
                  bg-red-500
                  hover:bg-red-600
                  transition-all
                  px-6
                  py-4
                  rounded-2xl
                  font-semibold
                "
              >

                {publishingAll
                  ? "Publishing..."
                  : "Publish All"}

              </button>

            </div>

            {/* DRAFT GRID */}

            <div className="
              grid
              grid-cols-1
              md:grid-cols-2
              xl:grid-cols-3
              gap-5
            ">

              {drafts.map((task) => (

                <div
                  key={task.id}
                  className="
                    bg-white/[0.03]
                    border
                    border-white/10
                    rounded-3xl
                    p-5
                    flex
                    flex-col
                    justify-between
                    min-h-[340px]
                  "
                >

                  <div>

                    <div className="
                      flex
                      items-start
                      justify-between
                      gap-4
                      mb-5
                    ">

                      <div className="min-w-0">

                        <p className="
                          text-[11px]
                          tracking-[0.25em]
                          uppercase
                          text-zinc-500
                          mb-2
                        ">
                          {task.task_code}
                        </p>

                        <h3 className="
                          text-xl
                          font-bold
                          leading-tight
                          line-clamp-2
                          break-words
                        ">

                          {task.title ||
                            "Untitled Task"}

                        </h3>

                      </div>

                      <div className="
                        flex
                        flex-col
                        gap-2
                        items-end
                        shrink-0
                      ">

                        <Badge>
                          {task.source}
                        </Badge>

                        <Badge>
                          Draft
                        </Badge>

                      </div>

                    </div>

                    {/* DETAILS */}

                    <div className="
                      space-y-3
                      text-sm
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
                        label="Time"
                        value={`${task.time_limit || 30} mins`}
                      />

                      <Detail
                        label="Type"
                        value={task.task_type}
                      />

                    </div>

                  </div>

                  {/* BUTTONS */}

                  <div className="
                    flex
                    gap-3
                    mt-6
                  ">

                    <button
                      onClick={() =>
                        handlePublishDraft(
                          task.id
                        )
                      }
                      className="
                        flex-1
                        bg-white
                        text-black
                        py-3
                        rounded-2xl
                        font-semibold
                        text-sm
                      "
                    >
                      Publish
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteDraft(
                          task.id
                        )
                      }
                      className="
                        px-4
                        bg-red-500/15
                        border
                        border-red-500/20
                        text-red-300
                        rounded-2xl
                        text-sm
                        font-semibold
                      "
                    >
                      Delete
                    </button>

                  </div>

                </div>
              ))}

            </div>

          </div>
        )}

      </div>

    </div>
  )
}

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

function TabButton({
  children,
  active,
  onClick
}: any) {

  return (

    <button
      onClick={onClick}
      className={`
        px-5
        py-3
        rounded-2xl
        font-semibold
        whitespace-nowrap
        transition-all
        ${
          active
            ? "bg-red-500"
            : "bg-white/10"
        }
      `}
    >
      {children}
    </button>
  )
}

function Badge({
  children
}: any) {

  return (

    <div className="
      bg-white/10
      px-3
      py-1
      rounded-full
      text-xs
      capitalize
    ">
      {children}
    </div>
  )
}

function Input({
  label,
  value,
  setValue,
  placeholder,
  type = "text",
}: any) {

  return (

    <div>

      <label className="
        block
        mb-2
        text-sm
        text-zinc-400
      ">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          setValue(
            e.target.value
          )
        }
        placeholder={placeholder}
        className="
          w-full
          bg-black/30
          border
          border-white/10
          rounded-2xl
          p-4
          outline-none
        "
      />

    </div>
  )
}

function Textarea({
  label,
  value,
  setValue,
  placeholder,
}: any) {

  return (

    <div>

      <label className="
        block
        mb-2
        text-sm
        text-zinc-400
      ">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) =>
          setValue(
            e.target.value
          )
        }
        placeholder={placeholder}
        rows={6}
        className="
          w-full
          bg-black/30
          border
          border-white/10
          rounded-2xl
          p-4
          outline-none
          resize-none
        "
      />

    </div>
  )
}