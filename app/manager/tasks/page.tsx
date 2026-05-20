"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Trash2,
  DollarSign,
  Hash,
  User,
  Clock,
  Loader2,
  Inbox
} from "lucide-react"

type Profile = {
  username: string
}

type Claim = {
  id: string
  status: string
  user_id: string
  profiles?: Profile
}

type Task = {
  id: string
  title: string
  description?: string
  subreddit?: string
  reward: number
  created_at: string
  task_claims?: Claim[]
}

export default function ManagerTasksPage() {

  const [tasks, setTasks] =
    useState<Task[]>([])

  const [loading, setLoading] =
    useState(true)

  // SEARCH STATE
  const [search, setSearch] =
    useState("")

  useEffect(() => {

    fetchTasks()

  }, [])

  async function fetchTasks() {

    try {

      const res =
        await fetch("/api/manager/tasks")

      const data =
        await res.json()

      console.log(
        "TASK DATA:",
        data
      )

      setTasks(
        Array.isArray(data)
          ? data
          : []
      )

    } catch (err) {

      console.error(err)

    } finally {

      setLoading(false)
    }
  }

  async function deleteTask(
    taskId: string
  ) {

    const confirmed =
      confirm("Delete this task?")

    if (!confirmed) return

    try {

      const res = await fetch(
        "/api/manager/tasks/delete",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            taskId
          })
        }
      )

      const data =
        await res.json()

      if (!res.ok) {

        throw new Error(data.error)
      }

      // REMOVE INSTANTLY
      setTasks((prev) =>
        prev.filter(
          (task) =>
            task.id !== taskId
        )
      )

    } catch (err) {

      console.error(err)

      alert(
        "Failed to delete task"
      )
    }
  }

  // FILTERED TASKS
  const filteredTasks =
    useMemo(() => {

      return tasks.filter(
        (task) =>
          task.id
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
      )

    }, [tasks, search])

  // LOADING
  if (loading) {

    return (
      <div className="p-6 md:p-10 flex flex-col items-center justify-center min-h-[50vh] text-slate-400 w-full">

        <Loader2
          className="animate-spin mb-4 text-red-500"
          size={32}
        />

        <p className="animate-pulse font-medium">
          Loading task pool...
        </p>

      </div>
    )
  }

  return (

    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full font-sans">

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
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
      >

        <div>

          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">

            Task Pool

            <span className="bg-white/10 text-slate-300 text-sm py-1 px-3 rounded-full font-medium border border-white/10">
              {tasks.length} Active Tasks
            </span>

          </h1>

          <p className="text-slate-400 mt-1 text-sm">
            Manage, search, and monitor all published tasks.
          </p>

        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full md:max-w-xs group">

          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-red-400 transition-colors">

            <Search size={18} />

          </div>

          <input
            type="text"
            placeholder="Search by Task ID..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder:text-slate-500 outline-none focus:bg-black/50 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all duration-300 shadow-inner shadow-black/50"
          />

        </div>

      </motion.div>

      {/* TASK LIST */}
      {filteredTasks.length === 0 ? (

        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          className="py-16 px-6 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-slate-500 bg-white/[0.01]"
        >

          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">

            <Inbox
              className="text-slate-600"
              size={32}
            />

          </div>

          <p className="text-lg font-medium text-slate-300">
            No tasks found
          </p>

          <p className="text-sm mt-1">
            Try adjusting your search criteria.
          </p>

        </motion.div>

      ) : (

        <motion.div
          layout
          className="grid gap-4"
        >

          <AnimatePresence mode="popLayout">

            {filteredTasks.map(
              (task) => {

                const claim =
                  task.task_claims?.[0]

                const claimed =
                  !!claim

                return (

                  <motion.div
                    layout
                    initial={{
                      opacity: 0,
                      scale: 0.95,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.95,
                      filter: "blur(4px)",
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                    key={task.id}
                    className="
                      group relative
                      bg-white/[0.03]
                      border-2
                      border-white/15
                      hover:bg-white/[0.05]
                      hover:border-white/25
                      transition-all duration-300
                      rounded-2xl
                      p-5 sm:p-6
                      shadow-lg
                      backdrop-blur-sm
                      overflow-hidden
                      flex flex-col sm:flex-row sm:items-start justify-between gap-6
                    "

                  >

                    {/* LEFT */}
                    <div className="flex-1 space-y-4">

                      {/* HEADER */}
                      <div>

                        <div className="flex items-center gap-2 mb-1.5">

                          <span className="font-mono text-[10px] text-slate-500 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                            ID: {task.id}
                          </span>

                        </div>

                        <h2 className="text-xl font-semibold text-white tracking-tight">
                          {task.title}
                        </h2>

                        {task.description && (

                          <p className="text-slate-400 text-sm mt-2 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                      </div>

                      {/* BADGES */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">

                        {/* REWARD */}
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/30 px-3 py-1.5 rounded-lg text-sm font-medium">

                          <DollarSign size={14} />

                          {task.reward}

                        </div>

                        {/* SUBREDDIT */}
                        {task.subreddit && (

                          <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg text-sm font-medium">

                            <Hash size={14} />

                            {task.subreddit}

                          </div>
                        )}

                        {/* STATUS */}
                        {claimed ? (

                          <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg text-sm font-medium">

                            <User size={14} />

                            Claimed by{" "}
                            {
                              claim.profiles
                                ?.username
                            }

                          </div>

                        ) : (

                          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-sm font-medium">

                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

                            Open

                          </div>
                        )}

                      </div>

                      {/* TIMESTAMP */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">

                        <Clock size={12} />

                        Created:{" "}
                        {new Date(
                          task.created_at
                        ).toLocaleString()}

                      </div>

                    </div>

                    {/* RIGHT */}
                    <div className="shrink-0 flex sm:flex-col justify-end items-end sm:border-l sm:border-white/10 sm:pl-6">

                      <button
                        onClick={() =>
                          deleteTask(task.id)
                        }
                        className="flex items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200 group/btn"
                        title="Delete Task"
                      >

                        <Trash2
                          size={18}
                          className="group-hover/btn:scale-110 transition-transform"
                        />

                      </button>

                    </div>

                  </motion.div>
                )
              }
            )}

          </AnimatePresence>

        </motion.div>
      )}

    </div>
  )
}