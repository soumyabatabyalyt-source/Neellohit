"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { motion } from "framer-motion"
import { 
  PlayCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Send 
} from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function CountdownTimer({ expiresAt, onExpire }: { expiresAt: string, onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState<string>("--:--")

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const distance = expiry - now

      if (distance <= 0) {
        setTimeLeft("00:00")
        onExpire()
        return
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setTimeLeft(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }

    updateTimer()
    const intervalId = setInterval(updateTimer, 1000)
    return () => clearInterval(intervalId)
  }, [expiresAt, onExpire])

  return (
    <span className="font-mono text-orange-400 font-bold ml-2 bg-black/30 px-2 py-1 rounded-md border border-orange-500/20">
      ⏱ {timeLeft}
    </span>
  )
}

export default function MyTasks() {
  const [claims, setClaims] = useState<any[]>([])

  const fetchTasks = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return

    const userId = session.user.id

    const { data, error } = await supabase
      .from("task_claims")
      .select(`
        *,
        tasks (
          id,
          task_code,
          task_type,
          comment_type,
          reward
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    setClaims(data || [])
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const submitTask = async (claim_id: string) => {
    const submission_link = prompt("Paste your Reddit link")
    if (!submission_link) return

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      alert("Not logged in ❌")
      return
    }

    const res = await fetch("/api/submit-task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        claim_id,
        submission_link,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || "Submission failed ❌")
      if (data.error === "Task expired") {
        fetchTasks()
      }
      return
    }

    alert("Submitted successfully ✅")
    fetchTasks()
  }

  // 🔥 FILTERS
  const active = claims.filter(c => c.status === "active")
  const pending = claims.filter(c => c.status === "submitted")
  const approved = claims.filter(c => c.status === "approved")
  const failed = claims.filter(c => c.status === "rejected")

  return (
    <div className="w-full font-sans text-slate-200">
      
      {/* --- Dashboard Content Header --- */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
          Mission <span className="text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-red-600">Control</span>
        </h1>
        <p className="text-slate-400 font-light">Manage your claimed bounties and track your payouts.</p>
      </div>

      <div className="space-y-12">
        <Section 
          title="Active Tasks" 
          claims={active} 
          submitTask={submitTask} 
          icon={<PlayCircle className="text-orange-400" size={26} />}
          badgeTheme="bg-orange-500/10 border-orange-500/30 text-orange-400"
          onExpire={fetchTasks}
        />
        <Section 
          title="Pending Approval" 
          claims={pending} 
          icon={<Clock className="text-blue-400" size={26} />}
          badgeTheme="bg-blue-500/10 border-blue-500/30 text-blue-400"
        />
        <Section 
          title="Approved Tasks" 
          claims={approved} 
          icon={<CheckCircle2 className="text-emerald-400" size={26} />}
          badgeTheme="bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
        />
        <Section 
          title="Failed Tasks" 
          claims={failed} 
          icon={<XCircle className="text-rose-400" size={26} />}
          badgeTheme="bg-rose-500/10 border-rose-500/30 text-rose-400"
        />
      </div>
    </div>
  )
}

// 🔥 REUSABLE SECTION
function Section({ title, claims, submitTask, icon, badgeTheme, onExpire }: any) {
  if (claims.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-white/5 border-2 border-white/10">
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">{title}</h2>
        <span className="ml-2 px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-bold border-2 border-white/10">
          {claims.length}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {claims.map((claim: any, index: number) => {
          const taskData = claim.tasks || {};
          const isComment = taskData.task_type === "comment";
          const titleText = isComment ? taskData.comment_type || "Comment Task" : "Post Task";

          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 80 }}
              key={claim.id}
              className="group p-6 md:p-8 rounded-[2rem] bg-blue-500/[0.04] border-2 border-white/20 hover:border-blue-400/40 backdrop-blur-2xl transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_30px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_12px_40px_rgba(96,165,250,0.15)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              {/* Task Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">
                    ID: {taskData.task_code || taskData.id || claim.task_id}
                  </span>
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold border-2 capitalize ${badgeTheme}`}>
                    {claim.status}
                  </span>
                  {claim.status === "active" && claim.expires_at && onExpire && (
                    <CountdownTimer expiresAt={claim.expires_at} onExpire={onExpire} />
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-100 group-hover:text-white transition-colors">
                  {titleText}
                </h3>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
                {/* ✅ Submit button */}
                {submitTask && claim.status === "active" && (
                  <button 
                    onClick={() => submitTask(claim.id)}
                    className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white text-sm font-bold transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 border-2 border-orange-400/30"
                  >
                    <Send size={18} />
                    Submit Work
                  </button>
                )}

                {/* ✅ Submission link */}
                {claim.submission_link && (
                  <a 
                    href={claim.submission_link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full md:w-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border-2 border-white/20 text-slate-300 hover:text-white text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    View Proof
                    <ExternalLink size={18} />
                  </a>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}