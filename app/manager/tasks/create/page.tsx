"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { PLATFORMS, PLATFORM_LABELS, PLATFORM_TASK_TYPES, PLATFORM_TARGET_LABEL, PLATFORM_TARGET_PLACEHOLDER, PLATFORM_LINK_LABEL, isTopLevelTaskType, type Platform } from "@/lib/platforms"

// =========================================
// HELPER: GET TASK TITLE
// =========================================
function getTaskTitle(task: any): string {
  if (task.title) return task.title
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

export default function CreateTaskPage() {

  const [activeTab, setActiveTab] = useState("manual")
  const [manualSection, setManualSection] = useState("create")
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [publishingAll, setPublishingAll] = useState(false)
  const [deletingAll, setDeleteingAll] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<any[]>([])
  const [importMessage, setImportMessage] = useState("")

  // =========================================
  // MULTI-PLATFORM FORM FIELDS
  // =========================================
  const [platform, setPlatform] = useState<Platform>("reddit")
  const [taskType, setTaskType] = useState("post")
  const [taskCode, setTaskCode] = useState("")
  const [target, setTarget] = useState("")
  const [contentLink, setContentLink] = useState("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [reward, setReward] = useState("")
  const [timeLimit, setTimeLimit] = useState("30")

  // Get available task types for current platform
  const availableTaskTypes = useMemo(() => {
    return PLATFORM_TASK_TYPES[platform] || []
  }, [platform])

  // Check if current task type is top-level
  const isTopLevel = useMemo(() => {
    return isTopLevelTaskType(platform, taskType)
  }, [platform, taskType])

  // =========================================
  // FETCH DRAFTS
  // =========================================
  async function fetchDrafts() {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("draft", true)
      .order("created_at", { ascending: false })
    setDrafts(data || [])
  }

  useEffect(() => {
    fetchDrafts()
  }, [])

  // =========================================
  // HANDLE PLATFORM CHANGE
  // =========================================
  function handlePlatformChange(newPlatform: Platform) {
    setPlatform(newPlatform)
    setTaskType(availableTaskTypes[0]?.value || "post")
    setTarget("")
    setContentLink("")
    setTitle("")
    setBody("")
  }

  // =========================================
  // IMPORT TASKS
  // =========================================
  async function handleImportTasks() {
    try {
      setImporting(true)
      setImportMessage("")
      const res = await fetch("/api/sync-tasks")
      const data = await res.json()

      if (!data.success) {
        setImportMessage(`Import failed: ${data.error || "Unknown error"}`)
        return
      }

      setImportMessage(`✅ ${data.inserted || data.synced || 0} tasks imported successfully`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      fetchDrafts()
    } catch (err) {
      console.error(err)
      setImportMessage(`Server error: ${err instanceof Error ? err.message : "Unknown error"}`)
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

      if (!body.trim()) {
        alert("Please enter task body/description")
        setLoading(false)
        return
      }

      if (isTopLevel) {
        if (!title.trim()) {
          alert("Please enter a title")
          setLoading(false)
          return
        }
        if (!target.trim()) {
          alert(`Please enter a ${PLATFORM_TARGET_LABEL[platform]}`)
          setLoading(false)
          return
        }
      } else {
        if (!contentLink.trim()) {
          alert(`Please enter a ${PLATFORM_LINK_LABEL[platform]}`)
          setLoading(false)
          return
        }
      }

      const payload = {
        task_code: taskCode,
        platform,
        task_type: taskType,
        title: isTopLevel ? title : `${taskType} on ${PLATFORM_LABELS[platform]}`,
        body,
        subreddit: isTopLevel ? target : contentLink,
        reward: parseFloat(reward) || 0,
        time_limit: Number(timeLimit),
        post_link: isTopLevel ? null : contentLink,
        status: "draft",
        draft: true,
        source: "manual",
      }

      const { error } = await supabase
        .from("tasks")
        .insert([payload])

      if (error) {
        alert(error.message)
        return
      }

      alert("Draft created ✅")

      setTaskCode("")
      setTitle("")
      setBody("")
      setTarget("")
      setContentLink("")
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
  async function handlePublishDraft(id: string) {
    try {
      setPublishingId(id)
      const { data, error } = await supabase
        .from("tasks")
        .update({
          draft: false,
          status: "open",
          published_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()

      if (error) {
        alert(`Error publishing: ${error.message}`)
        return
      }

      if (!data || data.length === 0) {
        alert("Publish failed: Task not found")
        return
      }

      const publishedTask = data[0]
      if (publishedTask) {
        fetch("/api/send-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: publishedTask.id,
            title: publishedTask.title,
            task_type: publishedTask.task_type,
            platform: publishedTask.platform,
            reward_credits: publishedTask.reward != null ? Math.round(Number(publishedTask.reward) * 100) : null,
            task_code: publishedTask.task_code,
          }),
        }).catch(err => console.warn("[Notification] Failed:", err))
      }

      await new Promise(resolve => setTimeout(resolve, 500))
      await fetchDrafts()
    } catch (err) {
      console.error(err)
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setPublishingId(null)
    }
  }

  // =========================================
  // DELETE DRAFT
  // =========================================
  async function handleDeleteDraft(id: string) {
    const confirmed = confirm("Delete this draft?")
    if (!confirmed) return

    try {
      setPublishingId(id)
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)

      if (error) {
        alert(`Error deleting: ${error.message}`)
        return
      }

      await new Promise(resolve => setTimeout(resolve, 500))
      await fetchDrafts()
    } catch (err) {
      console.error(err)
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`)
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
      const tasksToPublish = [...drafts]

      await supabase
        .from("tasks")
        .update({
          draft: false,
          status: "open",
          published_at: new Date().toISOString()
        })
        .eq("draft", true)

      if (tasksToPublish.length === 1) {
        const t = tasksToPublish[0]
        fetch("/api/send-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: t.id,
            title: t.title,
            task_type: t.task_type,
            platform: t.platform,
            reward_credits: t.reward != null ? Math.round(Number(t.reward) * 100) : null,
            task_code: t.task_code,
          }),
        }).catch(err => console.warn("[Notification] Failed:", err))
      } else {
        fetch("/api/send-summary-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tasks: tasksToPublish.map((t) => ({
              id: t.id,
              title: t.title,
              task_type: t.task_type,
              platform: t.platform,
              reward_credits: t.reward != null ? Math.round(Number(t.reward) * 100) : null,
              task_code: t.task_code,
            })),
          }),
        }).catch(err => console.warn("[Notification] Summary failed:", err))
      }

      fetchDrafts()
      alert("All drafts published")
    } catch (err) {
      console.error(err)
    } finally {
      setPublishingAll(false)
    }
  }

  // =========================================
  // DELETE ALL DRAFTS
  // =========================================
  async function handleDeleteAll() {
    const confirmed = confirm(`Delete all ${drafts.length} drafts? This cannot be undone.`)
    if (!confirmed) return

    try {
      setDeleteingAll(true)
      const ids = drafts.map((t) => t.id)
      const { error } = await supabase
        .from("tasks")
        .delete()
        .in("id", ids)

      if (error) {
        alert(`Error deleting: ${error.message}`)
        return
      }

      fetchDrafts()
      alert("All drafts deleted")
    } catch (err) {
      console.error(err)
    } finally {
      setDeleteingAll(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#05070A] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            Task Manager
          </h1>
          <p className="text-slate-400 mt-3 text-sm md:text-base">
            Create tasks for Reddit, Quora, Facebook, and Twitter
          </p>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <TabButton active={activeTab === "manual"} onClick={() => setActiveTab("manual")}>
            Create Manual
          </TabButton>
          <TabButton active={activeTab === "import"} onClick={() => setActiveTab("import")}>
            Import Tasks
          </TabButton>
          <TabButton active={activeTab === "drafts"} onClick={() => setActiveTab("drafts")}>
            Drafts ({drafts.length})
          </TabButton>
        </div>

        {/* MANUAL CREATION */}
        {activeTab === "manual" && (
          <div className="space-y-6">
            {/* PLATFORM SELECTOR */}
            <div className="bg-white/[0.03] backdrop-blur-xl border-2 border-white/15 rounded-3xl p-5 md:p-8">
              <h2 className="text-xl font-bold mb-4">Select Platform</h2>
              <div className="flex flex-wrap gap-3">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePlatformChange(p as Platform)}
                    className={`px-6 py-3 rounded-2xl font-semibold transition-all border-2 ${
                      platform === p
                        ? "bg-blue-500/30 border-blue-400/50 text-blue-200"
                        : "bg-white/5 border-white/15 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {PLATFORM_LABELS[p as Platform]}
                  </button>
                ))}
              </div>
            </div>

            {/* FORM CARD */}
            <div className="bg-white/[0.03] backdrop-blur-xl border-2 border-white/15 rounded-3xl p-5 md:p-8 space-y-6">
              {/* TASK CODE */}
              <Input
                label="Task ID"
                value={taskCode}
                setValue={setTaskCode}
                placeholder={`e.g., ${platform.toUpperCase()}-1-001`}
              />

              {/* TASK TYPE */}
              <div>
                <label className="block mb-2 text-sm text-slate-400 font-medium">Task Type</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="w-full bg-white/[0.03] border-2 border-white/15 text-white rounded-2xl p-4 outline-none focus:border-blue-500/50"
                >
                  {availableTaskTypes.map((t) => (
                    <option key={t.value} value={t.value} className="bg-black text-white">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* TITLE (for top-level tasks) */}
              {isTopLevel && (
                <Input
                  label="Title"
                  value={title}
                  setValue={setTitle}
                  placeholder="Task title"
                />
              )}

              {/* TARGET / LINK */}
              {isTopLevel ? (
                <Input
                  label={PLATFORM_TARGET_LABEL[platform]}
                  value={target}
                  setValue={setTarget}
                  placeholder={PLATFORM_TARGET_PLACEHOLDER[platform]}
                />
              ) : (
                <Input
                  label={PLATFORM_LINK_LABEL[platform]}
                  value={contentLink}
                  setValue={setContentLink}
                  placeholder={`Link to ${platform} content...`}
                />
              )}

              {/* BODY */}
              <Textarea
                label="Description / Instructions"
                value={body}
                setValue={setBody}
                placeholder="What should the tasker do?"
              />

              {/* REWARD & TIME LIMIT */}
              <div className="grid md:grid-cols-2 gap-5">
                <Input
                  label="Reward ($)"
                  value={reward}
                  setValue={setReward}
                  placeholder="0.50"
                  type="number"
                  step="0.01"
                />
                <Input
                  label="Time Limit (minutes)"
                  value={timeLimit}
                  setValue={setTimeLimit}
                  placeholder="30"
                  type="number"
                />
              </div>

              {/* CREATE BUTTON */}
              <button
                onClick={handleCreateTask}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all rounded-2xl p-4 font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Draft"}
              </button>
            </div>
          </div>
        )}

        {/* IMPORT */}
        {activeTab === "import" && (
          <div className="bg-white/[0.03] backdrop-blur-xl border-2 border-white/15 rounded-3xl p-5 md:p-8">
            <h2 className="text-3xl font-bold text-white">Import Tasks</h2>
            <p className="text-slate-400 mt-3 mb-8">Import tasks directly from Google Sheets</p>
            <button
              onClick={handleImportTasks}
              disabled={importing}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {importing ? "Importing..." : "Import Tasks"}
            </button>
            {importMessage && (
              <div className="mt-8 bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-5 text-sm text-blue-300">
                {importMessage}
              </div>
            )}
          </div>
        )}

        {/* DRAFTS */}
        {activeTab === "drafts" && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white">Draft Tasks</h2>
                <p className="text-slate-400 mt-2">Ready for publishing</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePublishAll}
                  disabled={publishingAll || deletingAll || drafts.length === 0}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all px-8 py-4 rounded-2xl font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {publishingAll ? "Publishing..." : "Publish All"}
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={deletingAll || publishingAll || drafts.length === 0}
                  className="bg-red-500/10 border-2 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 transition-all px-8 py-4 rounded-2xl font-semibold text-red-300 disabled:opacity-50"
                >
                  {deletingAll ? "Deleting..." : "Delete All"}
                </button>
              </div>
            </div>

            {/* DRAFT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {drafts.map((task) => (
                <div
                  key={task.id}
                  className="bg-white/[0.03] backdrop-blur-xl border-2 border-white/15 hover:border-white/25 hover:bg-white/[0.05] rounded-3xl p-6 flex flex-col justify-between min-h-[340px] transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="min-w-0">
                        <p className="text-[11px] tracking-[0.25em] uppercase text-zinc-500 mb-2">
                          {task.task_code}
                        </p>
                        <h3 className="text-xl font-bold leading-tight line-clamp-2">
                          {getTaskTitle(task)}
                        </h3>
                      </div>
                      <div className="flex flex-col gap-2 items-end shrink-0">
                        <Badge>{task.platform || "reddit"}</Badge>
                        <Badge>Draft</Badge>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      {task.platform !== "twitter" && (
                        <Detail label="Target" value={task.subreddit || "N/A"} />
                      )}
                      <Detail label="Reward" value={`$${task.reward || 0}`} />
                      <Detail label="Time" value={`${task.time_limit || 30} mins`} />
                      <Detail label="Type" value={task.task_type} />

                      {task.body && (
                        <Detail label="Description" value={task.body} />
                      )}
                    </div>
                  </div>

                  {/* BUTTONS */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => handlePublishDraft(task.id)}
                      disabled={publishingId === task.id}
                      className={`flex-1 py-3 rounded-2xl font-semibold text-sm transition-all shadow-lg ${
                        publishingId === task.id
                          ? "bg-emerald-500/50 text-white/70 cursor-not-allowed"
                          : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/20"
                      }`}
                    >
                      {publishingId === task.id ? "Publishing..." : "Publish"}
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(task.id)}
                      disabled={publishingId === task.id}
                      className={`px-4 rounded-2xl text-sm font-semibold transition-all backdrop-blur-sm border-2 ${
                        publishingId === task.id
                          ? "bg-red-500/5 border-red-500/15 text-red-300/50 cursor-not-allowed"
                          : "bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-500/50"
                      }`}
                    >
                      {publishingId === task.id ? "Deleting..." : "Delete"}
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

function Detail({ label, value }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-white/10 pb-3">
      <span className="text-slate-400 text-sm shrink-0 font-medium">{label}</span>
      <span className="text-white font-medium text-sm text-left sm:text-right break-all max-w-full sm:max-w-[65%]">
        {value}
      </span>
    </div>
  )
}

function TabButton({ children, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl font-semibold whitespace-nowrap transition-all backdrop-blur-xl border-2 ${
        active
          ? "bg-blue-500/30 border-blue-400/50 text-blue-200 shadow-lg shadow-blue-500/20"
          : "bg-white/5 border-white/15 text-slate-300 hover:bg-white/10 hover:border-white/20"
      }`}
    >
      {children}
    </button>
  )
}

function Badge({ children }: any) {
  return (
    <div className="bg-white/[0.03] backdrop-blur-sm border-2 border-white/15 px-3 py-1 rounded-full text-xs capitalize text-slate-300 font-medium">
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
  step,
}: any) {
  return (
    <div>
      <label className="block mb-2 text-sm text-slate-400 font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        step={step}
        className="w-full bg-white/[0.03] backdrop-blur-sm border-2 border-white/15 hover:border-white/20 focus:border-blue-500/50 focus:bg-white/[0.05] rounded-2xl p-4 text-white placeholder:text-slate-500 outline-none transition-all"
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
      <label className="block mb-2 text-sm text-slate-400 font-medium">{label}</label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full bg-white/[0.03] backdrop-blur-sm border-2 border-white/15 hover:border-white/20 focus:border-blue-500/50 focus:bg-white/[0.05] rounded-2xl p-4 text-white placeholder:text-slate-500 outline-none resize-none transition-all"
      />
    </div>
  )
}
