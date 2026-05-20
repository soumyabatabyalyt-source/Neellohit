"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Button from "@/components/ui/Button"

export default function MyTasks({ user }: any) {
  const [tasks, setTasks] = useState<any[]>([])
  const [proofs, setProofs] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<Record<string, number>>({})

  // 📦 Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      const { data } = await supabase
        .from("task_claims")
        .select("*, tasks!task_claims_task_id_fkey(*)")
        .eq("user_id", user.id)
        .eq("status", "active")

      setTasks(data || [])
    }

    if (user?.id) fetchTasks()
  }, [user])

  // ⏱ TIMER + AUTO EXPIRE
  useEffect(() => {
    const interval = setInterval(async () => {
      const updated: Record<string, number> = {}

      for (const claim of tasks) {
        if (!claim.expires_at) continue

        const expiryTime = new Date(claim.expires_at).getTime()
        const now = Date.now()
        const diff = expiryTime - now

        const secondsLeft = Math.max(0, Math.floor(diff / 1000))
        updated[claim.id] = secondsLeft

        // 🔥 AUTO EXPIRE
        if (secondsLeft === 0 && claim.status === "active") {
          console.log("Expiring claim:", claim.id)

          await supabase
            .from("task_claims")
            .update({
              status: "expired",
            })
            .eq("id", claim.id)

          // remove from UI instantly
          setTasks((prev) => prev.filter((t) => t.id !== claim.id))
        }
      }

      setTimeLeft(updated)
    }, 1000)

    return () => clearInterval(interval)
  }, [tasks])

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? "0" : ""}${s}`
  }

  const handleSubmit = async (taskId: string) => {
    const proof = proofs[taskId]
    if (!proof) return alert("Enter proof")

    // ❌ BLOCK if expired
    if ((timeLeft[taskId] || 0) === 0) {
      alert("Task expired")
      return
    }

    await supabase.from("submissions").insert([
      { task_id: taskId, user_id: user.id, proof },
    ])

    await supabase
      .from("tasks")
      .update({ status: "pending" })
      .eq("id", taskId)

    alert("Submitted!")
  }

  const active = tasks.filter((t) => t.status === "active")
  const pending = tasks.filter((t) => t.status === "pending")
  const approved = tasks.filter((t) => t.status === "approved")
  const rejected = tasks.filter((t) => t.status === "rejected")

  return (
    <div>

      {/* SUMMARY */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" }}>
        <div>Active: {active.length}</div>
        <div>Pending: {pending.length}</div>
        <div>Approved: {approved.length}</div>
        <div>Rejected: {rejected.length}</div>
      </div>

      {/* ACTIVE */}
      <h3>Active Tasks</h3>
      {active.map((task) => (
        <div key={task.id}>
          <h4>{task.title}</h4>

          {/* ⏱ TIMER */}
          <p>⏳ {formatTime(timeLeft[task.id] || 0)}</p>

          <input
            placeholder="Proof"
            value={proofs[task.id] || ""}
            onChange={(e) =>
              setProofs({ ...proofs, [task.id]: e.target.value })
            }
          />

          <Button onClick={() => handleSubmit(task.id)}>
            Submit
          </Button>
        </div>
      ))}

      {/* OTHER STATES */}
      <h3>Pending</h3>
      {pending.map((t) => <p key={t.id}>{t.title}</p>)}

      <h3>Approved</h3>
      {approved.map((t) => <p key={t.id}>{t.title}</p>)}

      <h3>Rejected</h3>
      {rejected.map((t) => <p key={t.id}>{t.title}</p>)}

    </div>
  )
}