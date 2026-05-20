// app/admin/withdrawals/page.tsx

"use client"

import { useEffect, useState } from "react"
import {
  Wallet,
  CheckCircle,
  XCircle,
  Clock3,
  RefreshCw,
} from "lucide-react"

import { supabase } from "@/lib/supabaseClient"

type Withdrawal = {
  id: string
  user_id: string
  amount: number
  status: string
  created_at: string
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<
    Withdrawal[]
  >([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  async function fetchWithdrawals() {
    setLoading(true)

    const { data, error } = await supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", {
        ascending: false,
      })

    if (!error && data) {
      setWithdrawals(data)
    }

    setLoading(false)
  }

  async function refreshWithdrawals() {
    setRefreshing(true)
    await fetchWithdrawals()
    setRefreshing(false)
  }

  async function updateWithdrawal(
    id: string,
    status: string
  ) {
    const confirmed = confirm(
      `Mark withdrawal as ${status}?`
    )

    if (!confirmed) return

    const { error } = await supabase
      .from("withdrawals")
      .update({
        status,
      })
      .eq("id", id)

    if (error) {
      alert(error.message)
      return
    }

    fetchWithdrawals()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-white flex items-center justify-center">
        <div className="animate-pulse text-lg">
          Loading withdrawals...
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
              Withdrawals
            </h1>

            <p className="text-zinc-400 mt-1">
              Manage payout requests.
            </p>
          </div>

          <button
            onClick={refreshWithdrawals}
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

        <div className="space-y-4">
          {withdrawals.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center text-zinc-500">
              No withdrawals found.
            </div>
          ) : (
            withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                      <Wallet className="w-5 h-5" />
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold">
                        ${withdrawal.amount}
                      </h2>

                      <p className="text-sm text-zinc-400 mt-1 break-all">
                        User ID: {withdrawal.user_id}
                      </p>

                      <p className="text-sm text-zinc-500 mt-1">
                        {new Date(
                          withdrawal.created_at
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {withdrawal.status ===
                      "pending" && (
                      <>
                        <button
                          onClick={() =>
                            updateWithdrawal(
                              withdrawal.id,
                              "approved"
                            )
                          }
                          className="bg-green-500/10 hover:bg-green-500/20 text-green-400 px-4 py-2 rounded-xl flex items-center gap-2 transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            updateWithdrawal(
                              withdrawal.id,
                              "rejected"
                            )
                          }
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl flex items-center gap-2 transition"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}

                    {withdrawal.status ===
                      "approved" && (
                      <div className="bg-green-500/10 text-green-400 px-4 py-2 rounded-xl flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Approved
                      </div>
                    )}

                    {withdrawal.status ===
                      "rejected" && (
                      <div className="bg-red-500/10 text-red-400 px-4 py-2 rounded-xl flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Rejected
                      </div>
                    )}

                    {withdrawal.status ===
                      "pending" && (
                      <div className="bg-yellow-500/10 text-yellow-400 px-4 py-2 rounded-xl flex items-center gap-2">
                        <Clock3 className="w-4 h-4" />
                        Pending
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}