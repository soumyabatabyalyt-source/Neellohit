"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function History() {
  const [tasks, setTasks] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user

      if (!user) return

      const { data } = await supabase
        .from("task_submissions")
        .select("*, tasks(*)")
        .eq("user_id", user.id)

      setTasks(data || [])
    }

    load()
  }, [])

  return (
    <div>
      <h1>Task History</h1>

      {["pending", "approved", "rejected"].map(status => (
        <div key={status}>
          <h2>{status.toUpperCase()}</h2>

          {tasks
            .filter(t => t.status === status)
            .map(t => (
              <div key={t.id} style={card}>
                {t.tasks?.title}
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}

const card = {
  padding: "10px",
  marginBottom: "5px",
  background: "#eee"
}