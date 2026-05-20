"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function WalletPage() {
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWallet() {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) return

      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single()

      if (data) {
        setBalance(data.balance || 0)
      }

      setLoading(false)
    }

    fetchWallet()
  }, [])

  async function handleWithdraw() {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    if (!user) {
      alert("Not logged in")
      return
    }

    if (balance <= 0) {
      alert("No balance to withdraw")
      return
    }

    console.log("Sending withdraw:", {
      user_id: user.id,
      amount: balance,
    })

    const res = await fetch("/api/withdraw", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
        amount: balance,
      }),
    })

    const data = await res.json()

    console.log("Response:", data)

    if (!res.ok) {
      alert(data.error || "Withdraw failed")
      return
    }

    alert("Withdrawal request sent!")

    // Optional: reset UI
    setBalance(0)
  }

  if (loading) {
    return <div className="p-6 text-white">Loading...</div>
  }

  return (
    <div className="p-6 text-white space-y-6">
      <h1 className="text-2xl font-bold">Wallet</h1>

      <div className="border border-white/20 rounded-xl p-6">
        <p className="text-lg">Balance</p>
        <p className="text-3xl font-bold text-emerald-400">${balance}</p>
      </div>

      <button
        onClick={handleWithdraw}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 font-bold"
      >
        Withdraw Balance
      </button>
    </div>
  )
}