"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { motion } from "framer-motion"

import {
  Wallet,
  IndianRupee,
  AtSign,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  Coins,
} from "lucide-react"

type WithdrawMethod =
  | "upi"
  | "crypto"

export default function WalletPage() {

  const [amount, setAmount] =
    useState("")

  const [upiId, setUpiId] =
    useState("")

  const [cryptoAddress, setCryptoAddress] =
    useState("")

  const [withdrawMethod, setWithdrawMethod] =
    useState<WithdrawMethod>("upi")

  const [loading, setLoading] =
    useState(false)

  const [statsLoading, setStatsLoading] =
    useState(true)

  // =========================================
  // WALLET STATS
  // =========================================

  const [approvedBalance, setApprovedBalance] =
    useState(0)

  const [pendingBalance, setPendingBalance] =
    useState(0)

  const [withdrawnBalance, setWithdrawnBalance] =
    useState(0)

  // =========================================
  // FETCH WALLET
  // =========================================

  useEffect(() => {

    fetchWallet()

  }, [])

  async function fetchWallet() {

    setStatsLoading(true)

    const {
      data: userData,
    } = await supabase.auth.getUser()

    const user =
      userData?.user

    if (!user) {

      setStatsLoading(false)

      return
    }

    // APPROVED
    const {
      data: approvedClaims,
    } = await supabase
      .from("task_claims")
      .select(`
        tasks!task_claims_task_id_fkey (
          reward
        )
      `)
      .eq("user_id", user.id)
      .eq("status", "approved")

    // PENDING
    const {
      data: pendingClaims,
    } = await supabase
      .from("task_claims")
      .select(`
        tasks!task_claims_task_id_fkey (
          reward
        )
      `)
      .eq("user_id", user.id)
      .in("status", [
        "submitted",
        "pending_review",
      ])

    // WITHDRAWALS
    const {
      data: withdrawals,
    } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "approved")

    // CALCULATE
    const approved =
      (approvedClaims || []).reduce(
        (sum: number, item: any) =>
          sum +
          Number(
            item.tasks?.reward || 0
          ),
        0
      )

    const pending =
      (pendingClaims || []).reduce(
        (sum: number, item: any) =>
          sum +
          Number(
            item.tasks?.reward || 0
          ),
        0
      )

    const withdrawn =
      (withdrawals || []).reduce(
        (sum: number, item: any) =>
          sum +
          Number(item.amount || 0),
        0
      )

    setApprovedBalance(approved)

    setPendingBalance(pending)

    setWithdrawnBalance(withdrawn)

    setStatsLoading(false)
  }

  // =========================================
  // AVAILABLE BALANCE
  // =========================================

  const rawAvailableBalance =
    approvedBalance -
    withdrawnBalance

  // NEVER NEGATIVE
  const availableBalance =
    Math.max(
      0,
      rawAvailableBalance
    )

  // =========================================
  // WITHDRAW
  // =========================================

  async function handleWithdraw() {

    setLoading(true)

    const {
      data: userData,
    } = await supabase.auth.getUser()

    const user =
      userData?.user

    if (!user) {

      alert("Not logged in")

      setLoading(false)

      return
    }

    if (
      !amount ||
      Number(amount) <= 0
    ) {

      alert("Enter valid amount")

      setLoading(false)

      return
    }

    if (
      Number(amount) >
      availableBalance
    ) {

      alert(
        "Insufficient available balance"
      )

      setLoading(false)

      return
    }

    if (
      withdrawMethod === "upi" &&
      !upiId
    ) {

      alert("Enter UPI ID")

      setLoading(false)

      return
    }

    if (
      withdrawMethod === "crypto" &&
      !cryptoAddress
    ) {

      alert(
        "Enter Binance ID or wallet address"
      )

      setLoading(false)

      return
    }

    try {

      const res = await fetch(
        "/api/withdraw",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            user_id: user.id,
            amount: Number(amount),

            method:
              withdrawMethod,

            upi_id:
              withdrawMethod ===
              "upi"
                ? upiId
                : null,

            crypto_address:
              withdrawMethod ===
              "crypto"
                ? cryptoAddress
                : null,
          }),
        }
      )

      const data =
        await res.json()

      if (!res.ok) {

        alert(
          data.error ||
          "Withdraw failed"
        )

        setLoading(false)

        return
      }

      alert(
        "Withdrawal request sent!"
      )

      setAmount("")
      setUpiId("")
      setCryptoAddress("")

      fetchWallet()

    } catch (err) {

      console.error(
        "ERROR:",
        err
      )

      alert(
        "Something went wrong"
      )
    }

    setLoading(false)
  }

  return (

    <div className="max-w-4xl mx-auto p-6 md:p-8 w-full font-sans">

      {/* HEADER */}
      <motion.div
        initial={{
          opacity: 0,
          y: -20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
        className="flex items-center gap-4 mb-8"
      >

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/5">

          <Wallet size={24} />

        </div>

        <div>

          <h1 className="text-3xl font-bold text-white tracking-tight">
            Wallet
          </h1>

          <p className="text-slate-400 mt-1 text-sm">
            Track earnings and withdraw your balance.
          </p>

        </div>

      </motion.div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

        <Card
          icon={<Wallet size={22} />}
          title="Available Balance"
          value={`$${availableBalance.toFixed(2)}`}
          color="text-green-400"
          loading={statsLoading}
        />

        <Card
          icon={<CheckCircle2 size={22} />}
          title="Approved Earnings"
          value={`$${approvedBalance.toFixed(2)}`}
          color="text-emerald-400"
          loading={statsLoading}
        />

        <Card
          icon={<Clock3 size={22} />}
          title="Pending Earnings"
          value={`$${pendingBalance.toFixed(2)}`}
          color="text-yellow-400"
          loading={statsLoading}
        />

        <Card
          icon={<CreditCard size={22} />}
          title="Total Withdrawn"
          value={`$${withdrawnBalance.toFixed(2)}`}
          color="text-blue-400"
          loading={statsLoading}
        />

      </div>

      {/* WITHDRAW FORM */}
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
          delay: 0.1,
        }}
        className="bg-white/[0.02] border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40 relative overflow-hidden"
      >

        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] pointer-events-none transform translate-x-1/2 -translate-y-1/2" />

        <div className="space-y-6 relative z-10">

          {/* METHOD */}
          <div>

            <label className="text-sm font-medium text-slate-400 mb-3 block">
              Withdrawal Method
            </label>

            <div className="grid grid-cols-2 gap-4">

              <button
                onClick={() =>
                  setWithdrawMethod(
                    "upi"
                  )
                }
                className={`rounded-2xl p-4 border transition-all flex items-center gap-3 ${
                  withdrawMethod ===
                  "upi"
                    ? "bg-red-500/10 border-red-500/30 text-red-300"
                    : "bg-white/[0.02] border-white/10 text-slate-400"
                }`}
              >

                <AtSign size={18} />

                UPI

              </button>

              <button
                onClick={() =>
                  setWithdrawMethod(
                    "crypto"
                  )
                }
                className={`rounded-2xl p-4 border transition-all flex items-center gap-3 ${
                  withdrawMethod ===
                  "crypto"
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                    : "bg-white/[0.02] border-white/10 text-slate-400"
                }`}
              >

                <Coins size={18} />

                Crypto

              </button>

            </div>

          </div>

          {/* AMOUNT */}
          <div className="space-y-2">

            <label className="text-sm font-medium text-slate-400 pl-1">
              Withdrawal Amount
            </label>

            <div className="relative">

              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">

                <IndianRupee size={18} />

              </div>

              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value
                  )
                }
                disabled={loading}
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-11 pr-4 py-4 text-white placeholder:text-slate-600 outline-none focus:bg-black/50 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
              />

            </div>

          </div>

          {/* UPI */}
          {withdrawMethod ===
            "upi" && (

            <div className="space-y-2">

              <label className="text-sm font-medium text-slate-400 pl-1">
                UPI ID
              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">

                  <AtSign size={18} />

                </div>

                <input
                  type="text"
                  placeholder="username@bank"
                  value={upiId}
                  onChange={(e) =>
                    setUpiId(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  className="w-full bg-black/30 border border-white/10 rounded-xl pl-11 pr-4 py-4 text-white placeholder:text-slate-600 outline-none focus:bg-black/50 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                />

              </div>

            </div>
          )}

          {/* CRYPTO */}
          {withdrawMethod ===
            "crypto" && (

            <div className="space-y-3">

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-sm text-purple-200 leading-relaxed">

                Paste your Binance ID or crypto wallet address.
                <br />
                Network: <span className="font-semibold">
                  USDT Polygon
                </span>

              </div>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">

                  <Coins size={18} />

                </div>

                <input
                  type="text"
                  placeholder="Binance ID or Wallet Address"
                  value={cryptoAddress}
                  onChange={(e) =>
                    setCryptoAddress(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  className="w-full bg-black/30 border border-white/10 rounded-xl pl-11 pr-4 py-4 text-white placeholder:text-slate-600 outline-none focus:bg-black/50 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                />

              </div>

            </div>
          )}

          {/* BUTTON */}
          <motion.button
            whileHover={{
              y: -2,
            }}
            whileTap={{
              y: 0,
            }}
            onClick={handleWithdraw}
            disabled={
              loading ||
              !amount
            }
            className="w-full mt-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white px-6 py-4 rounded-xl font-semibold shadow-lg shadow-red-500/20 hover:shadow-red-500/40 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 flex justify-center items-center gap-2 group"
          >

            {loading ? (

              <>
                <Loader2
                  size={20}
                  className="animate-spin text-white/80"
                />

                <span>
                  Processing Request...
                </span>
              </>

            ) : (

              <>
                <span>
                  Request Withdrawal
                </span>

                <ArrowRight
                  size={18}
                  className="text-white/80 group-hover:translate-x-1 transition-transform"
                />
              </>
            )}

          </motion.button>

        </div>

      </motion.div>

    </div>
  )
}

// =========================================
// CARD
// =========================================

function Card({
  icon,
  title,
  value,
  color,
  loading,
}: any) {

  return (

    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl">

      <div className="flex items-center justify-between mb-4">

        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 ${color}`}>
          {icon}
        </div>

      </div>

      <p className="text-slate-400 text-sm mb-2">
        {title}
      </p>

      {loading ? (

        <div className="h-8 w-32 rounded bg-white/5 animate-pulse" />

      ) : (

        <h2 className={`text-3xl font-bold ${color}`}>
          {value}
        </h2>
      )}

    </div>
  )
}