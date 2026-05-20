"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, User, Mail, ExternalLink, ShieldQuestion } from "lucide-react"

export default function Accounts() {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("approved", false)

    if (error) {
      console.error(error)
      return
    }

    setUsers(data || [])
  }

  // ✅ APPROVE USER
  const approveUser = async (id: string) => {
    try {
      const res = await fetch("/api/manager/accounts/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: id,
          action: "approve",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error(data.error)
        alert("Approval failed: " + (data.error || "Unknown error"))
        return
      }

      alert("User approved ✅ (Wallet created)")
      load()
    } catch (err) {
      console.error(err)
      alert("Approval failed")
    }
  }

  // ✅ REJECT USER
  const rejectUser = async (id: string) => {
    const confirmed = confirm("Reject this account?")
    if (!confirmed) return

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id)

    if (error) {
      console.error(error)
      alert("Rejection failed")
      return
    }

    alert("User rejected ❌")
    load()
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full font-sans">
      
      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          Pending Accounts
          {users.length > 0 && (
            <span className="bg-amber-500/20 text-amber-400 text-sm py-1 px-3 rounded-full font-medium border border-amber-500/20">
              {users.length} Awaiting
            </span>
          )}
        </h2>
        <p className="text-slate-400 mt-1 text-sm">
          Review and approve new users before they can access the platform.
        </p>
      </motion.div>

      {/* USER LIST */}
      {users.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 px-6 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center bg-white/[0.01]"
        >
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-inner">
            <ShieldQuestion className="text-slate-500" size={32} />
          </div>
          <p className="text-lg font-medium text-slate-300">No pending accounts</p>
          <p className="text-slate-500 text-sm mt-1 max-w-sm">
            All users have been reviewed. Check back later for new registrations.
          </p>
        </motion.div>
      ) : (
        <motion.div layout className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {users.map((u) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                transition={{ duration: 0.2 }}
                key={u.id}
                className="
                  group relative
                  p-5 sm:p-6
                  rounded-2xl
                  border-2
                  border-white/15
                  bg-white/[0.03]
                  backdrop-blur-sm
                  overflow-hidden
                  flex flex-col md:flex-row md:items-center justify-between gap-6
                  transition-all duration-300
                  hover:bg-white/[0.05]
                  hover:border-white/25
                  shadow-lg
                "
              >
                
                {/* INFO SECTION */}
                <div className="flex-1 space-y-4">
                  
                  {/* Top Row: Username & ID */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
                        <User size={18} className="text-slate-400" />
                        {u.username || "Unknown User"}
                      </h3>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono tracking-wider break-all bg-black/40 inline-block px-2 py-0.5 rounded border border-white/5">
                      ID: {u.id}
                    </p>
                  </div>

                  {/* Bottom Row: Meta Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    {/* Email */}
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Mail size={16} className="text-slate-500" />
                      {u.email}
                    </div>

                    {/* Reddit Link */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 rounded-full bg-[#FF4500]/20 flex items-center justify-center">
                        <span className="text-[10px] text-[#FF4500] font-bold">R</span>
                      </div>
                      {u.reddit ? (
                        <a
                          href={u.reddit}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-medium bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20"
                        >
                          {u.reddit.replace(/^https?:\/\/(www\.)?reddit\.com\/user\//, "")}
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">Not provided</span>
                      )}
                    </div>
                  </div>

                </div>

                {/* ACTION BUTTONS */}
                <div className="shrink-0 flex items-center gap-3 pt-4 border-t border-white/10 md:pt-0 md:border-t-0 md:pl-6 md:border-l">
                  <button
                    onClick={() => approveUser(u.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5"
                  >
                    <Check size={18} />
                    Approve
                  </button>

                  <button
                    onClick={() => rejectUser(u.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 hover:border-rose-500 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <X size={18} />
                    Reject
                  </button>
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}