"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

const REJECTION_REASONS = [
  "Filtered",
  "Mod Removed",
  "Low Quality",
  "Rule Violation",
  "Duplicate",
  "Incomplete",
  "Other",
]

export default function ReviewActions({
  claimId,
  onReviewed,
}: {
  claimId: string
  onReviewed?: () => void
}) {
  const [reviewing, setReviewing] = useState<"approved" | "rejected" | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [customReason, setCustomReason] = useState("")

  async function review(action: "approved" | "rejected", reason?: string) {
    setReviewing(action)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      alert("Login required")
      setReviewing(null)
      return
    }

    const body: any = { claim_id: claimId, action }

    if (action === "rejected" && reason) {
      body.rejectionReason = reason
    }

    const res = await fetch("/api/review-task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    })

    const payload = await res.json()
    setReviewing(null)

    if (!res.ok) {
      alert(payload.error || "Review failed")
      return
    }

    // Reset modal
    setShowRejectModal(false)
    setRejectReason("")
    setCustomReason("")

    onReviewed?.()
  }

  const handleRejectClick = () => {
    setShowRejectModal(true)
  }

  const handleConfirmReject = () => {
    if (!rejectReason) {
      alert("Please select a reason")
      return
    }

    const finalReason = rejectReason === "Other" ? customReason : rejectReason

    if (!finalReason) {
      alert("Please provide a reason")
      return
    }

    review("rejected", finalReason)
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => review("approved")}
          disabled={reviewing !== null || showRejectModal}
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-emerald-700 transition-colors"
        >
          {reviewing === "approved" ? "Approving..." : "Approve"}
        </button>
        <button
          onClick={handleRejectClick}
          disabled={reviewing !== null || showRejectModal}
          className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-rose-700 transition-colors"
        >
          Reject
        </button>
      </div>

      {/* REJECTION MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Reject Submission</h3>

            {/* REASON SELECT */}
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">
                Select Reason
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-rose-500/50"
              >
                <option value="">Choose a reason...</option>
                {REJECTION_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {/* CUSTOM REASON */}
            {rejectReason === "Other" && (
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">
                  Custom Reason
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Explain why this submission is being rejected..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50 min-h-[80px] text-sm"
                />
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex gap-3">
              <button
                onClick={handleConfirmReject}
                disabled={reviewing !== null}
                className="flex-1 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
              >
                {reviewing === "rejected" ? "Rejecting..." : "Confirm Reject"}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason("")
                  setCustomReason("")
                }}
                disabled={reviewing !== null}
                className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
