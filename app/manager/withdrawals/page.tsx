"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Banknote, DollarSign, User, Clock, AtSign, Check, X } from "lucide-react"

type Withdrawal = {
  id: string
  user_id: string
  amount: number
  status: string
  created_at: string
  upi_id?: string
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWithdrawals() {
      try {
        const res = await fetch("/api/manager/withdrawals")

        const data = await res.json()

        console.log("FRONTEND DATA:", data)

        // ✅ IMPORTANT FIX
        setWithdrawals(Array.isArray(data) ? data : [])

      } catch (err) {
        console.error("FETCH ERROR:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchWithdrawals()
  }, [])

  async function handleAction(
    id: string,
    action: "approve" | "reject"
  ) {
    try {
      const res = await fetch(
        "/api/manager/withdrawals/action",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            action,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      // ✅ remove from UI instantly
      setWithdrawals((prev) =>
        prev.filter((w) => w.id !== id)
      )

    } catch (err) {
      console.error("ACTION ERROR:", err)
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-10 flex flex-col items-center justify-center min-h-[50vh] text-slate-400 w-full">
        <Loader2 className="animate-spin mb-4 text-emerald-500" size={32} />
        <p className="animate-pulse font-medium">Loading withdrawal requests...</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full font-sans text-white">
      
      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          Withdrawals
          <span className="bg-white/10 text-slate-300 text-sm py-1 px-3 rounded-full font-medium border border-white/10">
            {withdrawals.length} Pending
          </span>
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Review and process user payout requests.</p>
      </motion.div>

      {/* WITHDRAWAL LIST */}
      {withdrawals.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 px-6 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-slate-500 bg-white/[0.01]"
        >
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-inner">
            <Banknote className="text-slate-500" size={32} />
          </div>
          <p className="text-lg font-medium text-slate-300">No pending withdrawals</p>
          <p className="text-sm mt-1">All payout requests have been processed.</p>
        </motion.div>
      ) : (
        <motion.div layout className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {withdrawals.map((w) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                transition={{ duration: 0.2 }}
                key={w.id}
                className="
                  bg-white/[0.03]
                  border-2
                  border-white/15
                  hover:border-white/25
                  hover:bg-white/[0.05]
                  transition-all duration-300
                  rounded-2xl
                  p-5 sm:p-6
                  shadow-lg
                  flex flex-col md:flex-row gap-6 justify-between
                  backdrop-blur-sm
                "
              >
                
                {/* INFO SECTION */}
                <div className="flex-1 space-y-4">
                  
                  {/* Top Row: User & Date */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-slate-400" />
                      <span className="text-sm font-mono text-slate-300 bg-black/40 px-2 py-1 rounded border border-white/5 truncate max-w-[200px] sm:max-w-xs">
                        {w.user_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Clock size={14} />
                      {new Date(w.created_at).toLocaleString()}
                    </div>
                  </div>

                  {/* Main Data Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 bg-white/[0.02] p-4 rounded-xl border-2 border-white/10">
                    
                    {/* Amount */}
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Amount</p>
                      <div className="flex items-center gap-1 text-2xl font-bold text-white tracking-tight">
                        <DollarSign size={20} className="text-emerald-400" />
                        {w.amount}
                      </div>
                    </div>

                    {/* UPI ID */}
                    {w.upi_id && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">UPI ID</p>
                        <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 font-medium tracking-wide">
                          <AtSign size={14} />
                          {w.upi_id}
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Status</p>
                      <div className="capitalize text-sm font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        {w.status}
                      </div>
                    </div>

                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="shrink-0 flex flex-row md:flex-col items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-white/10 md:border-l md:pl-6 w-full md:w-auto">
                  <button
                    onClick={() => handleAction(w.id, "approve")}
                    className="flex-1 md:w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5"
                  >
                    <Check size={18} />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => handleAction(w.id, "reject")}
                    className="flex-1 md:w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 hover:border-rose-500 px-5 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <X size={18} />
                    <span>Reject</span>
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