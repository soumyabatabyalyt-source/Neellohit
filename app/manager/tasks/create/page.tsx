"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function CreateTaskPage() {

  const [activeTab, setActiveTab] =
    useState("manual")

  const [manualSection, setManualSection] =
    useState("posts")

  const [loading, setLoading] =
    useState(false)

  const [importing, setImporting] =
    useState(false)

  const [publishingAll, setPublishingAll] =
    useState(false)

  const [publishingId, setPublishingId] =
    useState<string | null>(null)

  const [drafts, setDrafts] =
    useState<any[]>([])

  const [importMessage, setImportMessage] =
    useState("")

  const [taskType, setTaskType] =
    useState("post")

  // =========================================
  // FORM FIELDS
  // =========================================

  const [taskCode, setTaskCode] =
    useState("")

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
        await fetch("/api/sync-tasks")

      const data =
        await res.json()

      if (!data.success) {

        setImportMessage(
          `Import failed: ${data.error || "Unknown error"}`
        )

        return
      }

      setImportMessage(
        `✅ ${data.inserted || data.synced || 0} tasks imported successfully`
      )

      // Refresh drafts after import
      await new Promise(resolve => setTimeout(resolve, 1000))
      fetchDrafts()

    } catch (err) {

      console.error(err)

      setImportMessage(
        `Server error: ${err instanceof Error ? err.message : "Unknown error"}`
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

      if (!taskCode.trim()) {
        alert("Please enter a Task ID")
        setLoading(false)
        return
      }

      if (!title.trim()) {
        alert("Please enter a title")
        setLoading(false)
        return
      }

      const payload = {

        title,

        description:
          body,

        platform:
          "reddit",

        reward:
          Number(reward) || 0,

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
          taskCode
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
        "Draft created ✅"
      )

      setTaskCode("")
      setTitle("")
      setBody("")
      setSubreddit("")
      setReward("")
      setTimeLimit("30")

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

    try {

      setPublishingId(id)

      const { data, error } =
        await supabase
          .from("tasks")
          .update({
            draft: false,
            status: "open",
            published_at: new Date().toISOString()
          })
          .eq("id", id)
          .select()

      console.log(
        "Publish response:",
        { data, error }
      )

      if (error) {
        alert(
          `Error publishing: ${error.message}`
        )
        return
      }

      if (!data || data.length === 0) {
        alert(
          "Publish failed: Task not found"
        )
        return
      }

      // Wait briefly for DB to sync
      await new Promise(
        resolve =>
          setTimeout(resolve, 500)
      )

      await fetchDrafts()

    } catch (err) {

      console.error(err)
      alert(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      )

    } finally {

      setPublishingId(null)
    }
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

    try {

      setPublishingId(id)

      const { error } =
        await supabase
          .from("tasks")
          .delete()
          .eq("id", id)

      if (error) {
        alert(
          `Error deleting: ${error.message}`
        )
        return
      }

      await new Promise(
        resolve =>
          setTimeout(resolve, 500)
      )

      await fetchDrafts()

    } catch (err) {

      console.error(err)
      alert(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      )

    } finally {

      setPublishingId(null)
    }
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
          status: "open",
          approval_status: "approved",
          published_at: new Date().toISOString()
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
      md:p-8
    ">

      <div className="
        max-w-7xl
        mx-auto
      ">

        {/* HEADER */}

        <div className="mb-10">

          <h1 className="
            text-4xl
            md:text-5xl
            font-bold
            bg-gradient-to-r
            from-blue-400
            to-blue-600
            bg-clip-text
            text-transparent
          ">
            Task Manager
          </h1>

          <p className="
            text-slate-400
            mt-3
            text-sm
            md:text-base
          ">
            Create manual tasks, import from sheets, and manage drafts
          </p>

        </div>

        {/* TABS */}

        <div className="
          flex
          gap-4
          mb-8
          overflow-x-auto
          overflow-y-hidden
          pb-2
          scrollbar-hide
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
            Create Manual
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
            Import Tasks
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
            space-y-6
          ">

            {/* SECTION TABS */}
            <div className="
              flex
              gap-3
              mb-6
            ">
              <button
                onClick={() =>
                  setManualSection(
                    "posts"
                  )
                }
                className={`
                  px-6
                  py-3
                  rounded-2xl
                  font-semibold
                  transition-all
                  backdrop-blur-xl
                  border-2
                  ${
                    manualSection ===
                    "posts"
                      ? "bg-blue-500/30 border-blue-400/50 text-blue-200"
                      : "bg-white/5 border-white/15 text-slate-300 hover:bg-white/10"
                  }
                `}
              >
                Create Post
              </button>
              <button
                onClick={() =>
                  setManualSection(
                    "comments"
                  )
                }
                className={`
                  px-6
                  py-3
                  rounded-2xl
                  font-semibold
                  transition-all
                  backdrop-blur-xl
                  border-2
                  ${
                    manualSection ===
                    "comments"
                      ? "bg-blue-500/30 border-blue-400/50 text-blue-200"
                      : "bg-white/5 border-white/15 text-slate-300 hover:bg-white/10"
                  }
                `}
              >
                Create Comment
              </button>
            </div>

            {/* POSTS SECTION */}
            {manualSection ===
              "posts" && (
              <div className="
                bg-white/[0.03]
                backdrop-blur-xl
                border-2
                border-white/15
                rounded-3xl
                p-5
                md:p-8
                space-y-6
                shadow-lg
              ">

                <Input
                  label="Task ID (Manual Entry)"
                  value={taskCode}
                  setValue={setTaskCode}
                  placeholder="e.g., A-1-1001"
                />

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
                    bg-gradient-to-r
                    from-blue-500
                    to-blue-600
                    hover:from-blue-600
                    hover:to-blue-700
                    transition-all
                    rounded-2xl
                    p-4
                    font-semibold
                    text-white
                    shadow-lg
                    shadow-blue-500/20
                  "
                >
                  {loading
                    ? "Saving..."
                    : "Save Draft"}
                </button>

              </div>
            )}

            {/* COMMENTS SECTION */}
            {manualSection ===
              "comments" && (
              <div className="
                bg-white/[0.03]
                backdrop-blur-xl
                border-2
                border-white/15
                rounded-3xl
                p-5
                md:p-8
                space-y-6
                shadow-lg
              ">

                <Input
                  label="Task ID (Manual Entry)"
                  value={taskCode}
                  setValue={setTaskCode}
                  placeholder="e.g., B-2-1002"
                />

                <Input
                  label="Subreddit"
                  value={subreddit}
                  setValue={setSubreddit}
                  placeholder="r/AskReddit"
                />

                <div className="
                  grid
                  md:grid-cols-2
                  gap-5
                ">
                  <div>
                    <label className="
                      block
                      mb-2
                      text-sm
                      text-slate-400
                    ">
                      Comment Type
                    </label>
                    <select
                      value={commentType}
                      onChange={(e) =>
                        setCommentType(
                          e.target.value
                        )
                      }
                      className="
                        w-full
                        bg-white/[0.03]
                        border-2
                        border-white/15
                        text-white
                        rounded-2xl
                        p-4
                        outline-none
                        focus:border-blue-500/50
                        focus:bg-white/[0.05]
                        transition-all
                      "
                    >
                      <option value="comment">
                        Comment
                      </option>
                      <option value="reply">
                        Reply
                      </option>
                    </select>
                  </div>
                  <Input
                    label="Post Link"
                    value={subreddit}
                    setValue={setSubreddit}
                    placeholder="https://reddit.com/r/..."
                  />
                </div>

                <Textarea
                  label="Comment Body"
                  value={body}
                  setValue={setBody}
                  placeholder="Comment text"
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
                    bg-gradient-to-r
                    from-blue-500
                    to-blue-600
                    hover:from-blue-600
                    hover:to-blue-700
                    transition-all
                    rounded-2xl
                    p-4
                    font-semibold
                    text-white
                    shadow-lg
                    shadow-blue-500/20
                  "
                >
                  {loading
                    ? "Saving..."
                    : "Save Draft"}
                </button>

              </div>
            )}

          </div>
        )}

        {/* IMPORT */}

        {activeTab ===
          "import" && (

          <div className="
            bg-white/[0.03]
            backdrop-blur-xl
            border-2
            border-white/15
            rounded-3xl
            p-5
            md:p-8
            shadow-lg
          ">

            <h2 className="
              text-3xl
              font-bold
              text-white
            ">
              Import Tasks
            </h2>

            <p className="
              text-slate-400
              mt-3
              mb-8
            ">
              Import tasks directly from Google Sheets
            </p>

            <button
              onClick={
                handleImportTasks
              }
              disabled={importing}
              className="
                bg-gradient-to-r
                from-emerald-500
                to-emerald-600
                hover:from-emerald-600
                hover:to-emerald-700
                text-white
                px-8
                py-4
                rounded-2xl
                font-semibold
                transition-all
                shadow-lg
                shadow-emerald-500/20
                disabled:opacity-50
              "
            >

              {importing
                ? "Importing..."
                : "Import Tasks"}

            </button>

            {importMessage && (

              <div className="
                mt-8
                bg-blue-500/10
                border-2
                border-blue-500/30
                rounded-2xl
                p-5
                text-sm
                text-blue-300
                backdrop-blur-sm
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
              mb-8
            ">

              <div>

                <h2 className="
                  text-3xl
                  font-bold
                  text-white
                ">
                  Draft Tasks
                </h2>

                <p className="
                  text-slate-400
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
                  bg-gradient-to-r
                  from-emerald-500
                  to-emerald-600
                  hover:from-emerald-600
                  hover:to-emerald-700
                  transition-all
                  px-8
                  py-4
                  rounded-2xl
                  font-semibold
                  text-white
                  shadow-lg
                  shadow-emerald-500/20
                  disabled:opacity-50
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
              gap-6
            ">

              {drafts.map((task) => (

                <div
                  key={task.id}
                  className="
                    bg-white/[0.03]
                    backdrop-blur-xl
                    border-2
                    border-white/15
                    hover:border-white/25
                    hover:bg-white/[0.05]
                    rounded-3xl
                    p-6
                    flex
                    flex-col
                    justify-between
                    min-h-[340px]
                    transition-all
                    duration-300
                    shadow-lg
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
                      disabled={
                        publishingId === task.id
                      }
                      className={`
                        flex-1
                        py-3
                        rounded-2xl
                        font-semibold
                        text-sm
                        transition-all
                        shadow-lg
                        ${
                          publishingId ===
                          task.id
                            ? "bg-emerald-500/50 text-white/70 cursor-not-allowed shadow-emerald-500/10"
                            : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/20"
                        }
                      `}
                    >
                      {publishingId ===
                      task.id
                        ? "Publishing..."
                        : "Publish"}
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteDraft(
                          task.id
                        )
                      }
                      disabled={
                        publishingId === task.id
                      }
                      className={`
                        px-4
                        rounded-2xl
                        text-sm
                        font-semibold
                        transition-all
                        backdrop-blur-sm
                        border-2
                        ${
                          publishingId ===
                          task.id
                            ? "bg-red-500/5 border-red-500/15 text-red-300/50 cursor-not-allowed"
                            : "bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-500/50"
                        }
                      `}
                    >
                      {publishingId ===
                      task.id
                        ? "Deleting..."
                        : "Delete"}
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
      border-white/10
      pb-3
    ">

      <span className="
        text-slate-400
        text-sm
        shrink-0
        font-medium
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
        px-6
        py-3
        rounded-2xl
        font-semibold
        whitespace-nowrap
        transition-all
        backdrop-blur-xl
        border-2
        ${
          active
            ? "bg-blue-500/30 border-blue-400/50 text-blue-200 shadow-lg shadow-blue-500/20"
            : "bg-white/5 border-white/15 text-slate-300 hover:bg-white/10 hover:border-white/20"
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
      bg-white/[0.03]
      backdrop-blur-sm
      border-2
      border-white/15
      px-3
      py-1
      rounded-full
      text-xs
      capitalize
      text-slate-300
      font-medium
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
        text-slate-400
        font-medium
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
          bg-white/[0.03]
          backdrop-blur-sm
          border-2
          border-white/15
          hover:border-white/20
          focus:border-blue-500/50
          focus:bg-white/[0.05]
          rounded-2xl
          p-4
          text-white
          placeholder:text-slate-500
          outline-none
          transition-all
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
        text-slate-400
        font-medium
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
          bg-white/[0.03]
          backdrop-blur-sm
          border-2
          border-white/15
          hover:border-white/20
          focus:border-blue-500/50
          focus:bg-white/[0.05]
          rounded-2xl
          p-4
          text-white
          placeholder:text-slate-500
          outline-none
          resize-none
          transition-all
        "
      />

    </div>
  )
}