"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function TaskPool({ user }: any) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const fetchTasks = async () => {
      console.log("Fetching tasks...")

      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
.eq("status", "active") // TEMP: removed filter for debugging

        if (error) {
          console.error("Supabase error:", error)
          setErrorMsg("Failed to load tasks")
        } else {
          console.log("Tasks fetched:", data)
          setTasks(data || [])
        }
      } catch (err) {
        console.error("Unexpected error:", err)
        setErrorMsg("Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  // 🔄 Loading state
  if (loading) {
    return <p>Loading tasks...</p>
  }

  // ❌ Error state
  if (errorMsg) {
    return <p style={{ color: "red" }}>{errorMsg}</p>
  }

  return (
    <div>
      <h2>Task Pool</h2>

      {/* 🧪 Debug info */}
      <p style={{ fontSize: "12px", opacity: 0.6 }}>
        Total tasks: {tasks.length}
      </p>

      {/* ❌ No tasks */}
      {tasks.length === 0 && (
        <p>No tasks available (check database or RLS)</p>
      )}

      {/* ✅ Tasks list */}
      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            border: "1px solid #ccc",
            padding: "12px",
            marginBottom: "12px",
            borderRadius: "8px",
          }}
        >
          <h3>{task.title}</h3>
          <p>{task.description}</p>

          <p>
            <b>Platform:</b> {task.platform}
          </p>

          <p>
            <b>Reward:</b> ${task.reward}
          </p>

          <p>
            <b>Status:</b> {task.status}
          </p>
        </div>
      ))}
    </div>
  )
}