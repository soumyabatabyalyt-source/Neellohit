"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Button from "@/components/ui/Button"

type Task = {
  id: string
  title: string
  description: string
  reward: number
  status: string
}

export default function MyTasks({ user }: any) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [proofs, setProofs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  // 📦 Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("claimed_by", user.id)

      if (error) {
        console.error(error)
      } else {
        setTasks(data || [])
      }

      setLoading(false)
    }

    if (user?.id) fetchTasks()
  }, [user])

  // 📤 Submit proof
  const handleSubmit = async (taskId: string) => {
    const proof = proofs[taskId]

    if (!proof) {
      alert("Please enter proof")
      return
    }

    const { error } = await supabase.from("submissions").insert([
      {
        task_id: taskId,
        user_id: user.id,
        proof,
      },
    ])

    if (error) {
      console.error(error)
      alert("Submission failed")
    } else {
      alert("Submitted for review!")
    }
  }

  if (loading) return <p>Loading...</p>

  // 📊 Categorize tasks
  const active = tasks.filter((t) => t.status === "active")
  const pending = tasks.filter((t) => t.status === "pending")
  const approved = tasks.filter((t) => t.status === "approved")

  // 🎨 Reusable card style
  const cardStyle: React.CSSProperties = {
    background: "#0f172a",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #334155",
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
  }

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
    marginBottom: "30px",
  }

  const renderTasks = (list: Task[]) => {
    if (list.length === 0) return <p>No tasks</p>

    return (
      <div style={gridStyle}>
        {list.map((task) => (
          <div key={task.id} style={cardStyle}>
            <h3>{task.title}</h3>
            <p style={{ opacity: 0.7 }}>{task.description}</p>
            <p><b>Reward:</b> ${task.reward}</p>

            {/* Only allow submission for active tasks */}
            {task.status === "active" && (
              <>
                <input
                  type="text"
                  placeholder="Paste proof link..."
                  value={proofs[task.id] || ""}
                  onChange={(e) =>
                    setProofs({ ...proofs, [task.id]: e.target.value })
                  }
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    marginBottom: "10px",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #334155",
                    background: "#020617",
                    color: "#fff",
                  }}
                />

                <Button
                  variant="success"
                  onClick={() => handleSubmit(task.id)}
                >
                  Submit Proof 🚀
                </Button>
              </>
            )}

            {task.status === "pending" && (
              <p style={{ color: "#facc15", marginTop: "10px" }}>
                ⏳ Pending Review
              </p>
            )}

            {task.status === "approved" && (
              <p style={{ color: "#22c55e", marginTop: "10px" }}>
                ✅ Approved
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ width: "100%" }}>
      <h2 style={{ marginBottom: "20px" }}>My Tasks</h2>

      <h3>Active Tasks</h3>
      {renderTasks(active)}

      <h3>Pending Tasks</h3>
      {renderTasks(pending)}

      <h3>Approved Tasks</h3>
      {renderTasks(approved)}
    </div>
  )
}