"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"
import { Search, User, Mail, Shield, Clock, Timer, Loader2, Save, ExternalLink } from "lucide-react"

type Tasker = {
  id: string
  username?: string | null
  email: string | null
  reddit: string | null
  role: string | null
  cooldown_minutes?: number | null
  cooldown_until?: string | null
}

export default function Taskers() {
  const [users, setUsers] = useState<Tasker[]>([])
  const [saving, setSaving] = useState<string | null>(null)

  // ✅ username search
  const [search, setSearch] = useState("")

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, username, email, reddit, role, cooldown_minutes, cooldown_until"
      )
      .in("role", ["tasker", "user"])

    if (error) {
      console.error(error)
      return
    }

    setUsers(data || [])
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load()
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [load])

  async function saveCooldown(
    userId: string,
    hours: number,
    minutes: number
  ) {
    setSaving(userId)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      alert("Login required")
      setSaving(null)
      return
    }

    const res = await fetch("/api/update-tasker-cooldown", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        user_id: userId,
        hours,
        minutes,
      }),
    })

    const payload = await res.json()

    setSaving(null)

    if (!res.ok) {
      alert(payload.error || "Cooldown update failed")
      return
    }

    await load()
  }

  // ✅ filtered users
  const filteredUsers = users.filter((user) =>
    (user.username || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full font-sans text-white">
      
      {/* HEADER & SEARCH */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Taskers
            <span className="bg-white/10 text-slate-300 text-sm py-1 px-3 rounded-full font-medium border border-white/10">
              {users.length} Users
            </span>
          </h2>
          <p className="text-slate-400 mt-1 text-sm">
            Manage user roles and set operational cooldowns.
          </p>
        </div>

        {/* ✅ SEARCH BAR */}
        <div className="relative w-full md:max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-red-400 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-500 outline-none focus:bg-black/50 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all duration-300"
          />
        </div>
      </motion.div>

      {/* TASKER LIST */}
      {filteredUsers.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 px-6 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-slate-500 bg-white/[0.01]"
        >
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-inner">
            <User className="text-slate-500" size={32} />
          </div>
          <p className="text-lg font-medium text-slate-300">No taskers found</p>
          <p className="text-sm mt-1">Try a different search term.</p>
        </motion.div>
      ) : (
        <motion.div layout className="grid gap-5">
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((user) => (
              <TaskerCard
                key={user.id}
                user={user}
                saving={saving === user.id}
                saveCooldown={saveCooldown}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

function TaskerCard({
  user,
  saving,
  saveCooldown,
}: {
  user: Tasker
  saving: boolean
  saveCooldown: (
    userId: string,
    hours: number,
    minutes: number
  ) => void
}) {
  const currentMinutes = Number(user.cooldown_minutes || 0)
  const [hours, setHours] = useState(Math.floor(currentMinutes / 60))
  const [minutes, setMinutes] = useState(currentMinutes % 60)

  const isCooldownActive = formatCooldownUntil(user.cooldown_until) !== "None"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
      className="
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
        flex flex-col lg:flex-row gap-6 justify-between
      "

    >
      {/* USER INFO */}
      <div className="flex-1 space-y-4">
        
        {/* Header Row */}
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <User size={20} className="text-slate-400" />
            {user.username || "Unknown"}
          </h3>
          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
            user.role === 'tasker' 
              ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
              : "bg-slate-500/10 text-slate-400 border-slate-500/20"
          }`}>
            {user.role || "N/A"}
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-slate-500" />
            <span className="truncate">{user.email || "N/A"}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#FF4500]/20 flex items-center justify-center">
              <span className="text-[10px] text-[#FF4500] font-bold">R</span>
            </div>
            {user.reddit ? (
              <a 
                href={user.reddit} 
                target="_blank" 
                rel="noreferrer"
                className="text-slate-300 hover:text-white transition-colors flex items-center gap-1"
              >
                {user.reddit.replace(/^https?:\/\/(www\.)?reddit\.com\/user\//, "")}
                <ExternalLink size={12} className="opacity-50" />
              </a>
            ) : (
              <span className="text-slate-500 italic">N/A</span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:col-span-2 mt-1">
            <Clock size={16} className={isCooldownActive ? "text-amber-500" : "text-slate-500"} />
            <span className="text-slate-400">Cooldown status:</span>
            <span className={`font-medium ${isCooldownActive ? "text-amber-400" : "text-emerald-400"}`}>
              {formatCooldownUntil(user.cooldown_until)}
            </span>
          </div>
        </div>
      </div>

      {/* COOLDOWN CONTROLS */}
      <div className="shrink-0 bg-white/[0.02] rounded-xl p-4 border-2 border-white/15 flex flex-col justify-center min-w-[280px]">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-400">
          <Timer size={16} /> Set Cooldown Time
        </div>
        
        <div className="flex items-end gap-3 flex-wrap sm:flex-nowrap">
          <label className="flex-1 space-y-1">
            <span className="text-xs text-slate-500 pl-1 uppercase tracking-wider font-semibold">Hours</span>
            <input
              type="number"
              min={0}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full bg-white/[0.03] border-2 border-white/15 rounded-lg px-3 py-2.5 text-white outline-none focus:bg-white/[0.05] focus:border-red-500/40 transition-all font-mono"
            />
          </label>

          <label className="flex-1 space-y-1">
            <span className="text-xs text-slate-500 pl-1 uppercase tracking-wider font-semibold">Minutes</span>
            <input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="w-full bg-white/[0.03] border-2 border-white/15 rounded-lg px-3 py-2.5 text-white outline-none focus:bg-white/[0.05] focus:border-red-500/40 transition-all font-mono"
            />
          </label>

          <button
            onClick={() => saveCooldown(user.id, hours, minutes)}
            disabled={saving}
            className="h-[42px] px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span className="hidden sm:inline">{saving ? "..." : "Save"}</span>
          </button>
        </div>
      </div>

    </motion.div>
  )
}

function formatCooldownUntil(value?: string | null) {
  if (!value) return "None"

  const ms = new Date(value).getTime() - Date.now()
  if (ms <= 0) return "None"

  const totalMinutes = Math.ceil(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${hours}h ${minutes}m remaining`
}