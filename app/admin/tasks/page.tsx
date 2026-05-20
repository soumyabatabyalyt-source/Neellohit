// app/admin/tasks/page.tsx

"use client"

import { useEffect, useState } from "react"
import {
  ClipboardList,
  RefreshCw,
  Trash2,
  Eye,
} from "lucide-react"

import { supabase } from "@/lib/supabaseClient"

type Task = {
  id: string
  title: string
  reward: number
  status: string
  created_at: string
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    setLoading(true)

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setTasks(data)
    }

    setLoading(false)
  }

  async function refreshTasks() {
    setRefreshing(true)
    await fetchTasks()
    setRefreshing(false)
  }

  async function deleteTask(taskId: string) {
    const confirmed = confirm(
      "Delete this task?"
    )

    if (!confirmed) return

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)

    if (error) {
      alert(error.message)
      return
    }

    fetchTasks()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-white flex items-center justify-center">
        <div className="animate-pulse text-lg">
          Loading tasks...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">
              Task Management
            </h1>

            <p className="text-zinc-400 mt-1">
              Manage all platform tasks.
            </p>
          </div>

          <button
            onClick={refreshTasks}
            className="bg-white text-black px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          {tasks.length === 0 ? (
            <div className="p-10 text-center text-zinc-500">
              No tasks found.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 hover:bg-zinc-800/40 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                      <ClipboardList className="w-5 h-5" />
                    </div>

                    <div>
                      <h2 className="font-semibold text-lg">
                        {task.title}
                      </h2>

                      <div className="flex items-center gap-3 mt-1 text-sm text-zinc-400">
                        <span>
                          ${task.reward}
                        </span>

                        <span className="capitalize">
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 rounded-xl flex items-center gap-2 transition">
                      <Eye className="w-4 h-4" />
                      View
                    </button>

                    <button
                      onClick={() =>
                        deleteTask(task.id)
                      }
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl flex items-center gap-2 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}