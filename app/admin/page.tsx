"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  Users,
  ClipboardList,
  CheckCircle,
  Clock3,
  AlertTriangle,
  Wallet,
  Activity,
  FileWarning,
} from "lucide-react"

type Stats = {
  totalTasksToday: number
  totalClaimedToday: number
  totalSubmissions: number
  totalPending: number
  totalAccounts: number
  totalApproved: number
  totalPayout: number
  failedClaims: number
}

type ActivityItem = {
  id: string
  user_id: string
  task_id: string
  status: string
  created_at: string
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalTasksToday: 0,
    totalClaimedToday: 0,
    totalSubmissions: 0,
    totalPending: 0,
    totalAccounts: 0,
    totalApproved: 0,
    totalPayout: 0,
    failedClaims: 0,
  })

  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    setLoading(true)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const isoToday = today.toISOString()

    // Tasks published today
    const { count: totalTasksToday } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .gte("created_at", isoToday)

    // Claims today
    const { count: totalClaimedToday } = await supabase
      .from("task_claims")
      .select("*", { count: "exact", head: true })
      .gte("created_at", isoToday)

    // Total submissions
    const { count: totalSubmissions } = await supabase
      .from("task_submissions")
      .select("*", { count: "exact", head: true })

    // Pending submissions
    const { count: totalPending } = await supabase
      .from("task_submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")

    // Approved submissions
    const { data: approvedSubmissions } = await supabase
      .from("task_submissions")
      .select("reward")
      .eq("status", "approved")

    const totalApproved = approvedSubmissions?.length || 0

    const totalPayout =
      approvedSubmissions?.reduce(
        (sum, item) => sum + Number(item.reward || 0),
        0
      ) || 0

    // Accounts
    const { count: totalAccounts } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    // Failed / expired claims
    const { count: failedClaims } = await supabase
      .from("task_claims")
      .select("*", { count: "exact", head: true })
      .in("status", ["expired", "failed"])

    // Activity feed
    const { data: activityData } = await supabase
      .from("task_claims")
      .select("*")
      .in("status", ["expired", "failed"])
      .order("created_at", { ascending: false })
      .limit(15)

    setStats({
      totalTasksToday: totalTasksToday || 0,
      totalClaimedToday: totalClaimedToday || 0,
      totalSubmissions: totalSubmissions || 0,
      totalPending: totalPending || 0,
      totalAccounts: totalAccounts || 0,
      totalApproved,
      totalPayout,
      failedClaims: failedClaims || 0,
    })

    setActivity(activityData || [])
    setLoading(false)
  }

  const cards = [
    {
      title: "Tasks Published Today",
      value: stats.totalTasksToday,
      icon: ClipboardList,
    },
    {
      title: "Tasks Claimed Today",
      value: stats.totalClaimedToday,
      icon: Activity,
    },
    {
      title: "Total Submissions",
      value: stats.totalSubmissions,
      icon: CheckCircle,
    },
    {
      title: "Pending Reviews",
      value: stats.totalPending,
      icon: Clock3,
    },
    {
      title: "Total Accounts",
      value: stats.totalAccounts,
      icon: Users,
    },
    {
      title: "Approved Submissions",
      value: stats.totalApproved,
      icon: CheckCircle,
    },
    {
      title: "Total Payout / Dues",
      value: `$${stats.totalPayout.toFixed(2)}`,
      icon: Wallet,
    },
    {
      title: "Failed / Expired Claims",
      value: stats.failedClaims,
      icon: FileWarning,
    },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-zinc-400 mt-1">
          Monitor platform activity and worker performance
        </p>
      </div>

      {loading ? (
        <div className="text-zinc-400">Loading dashboard...</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {cards.map((card, index) => {
              const Icon = card.icon

              return (
                <div
                  key={index}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-zinc-400 text-sm">{card.title}</p>
                      <h2 className="text-3xl font-bold mt-2">
                        {card.value}
                      </h2>
                    </div>

                    <div className="bg-zinc-800 p-3 rounded-xl">
                      <Icon size={22} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Activity Feed */}
          <div className="mt-10 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle className="text-red-400" size={22} />
              <h2 className="text-xl font-semibold">
                Failed / Expired Claims Activity
              </h2>
            </div>

            {activity.length === 0 ? (
              <p className="text-zinc-400">
                No failed or expired claims found.
              </p>
            ) : (
              <div className="space-y-4">
                {activity.map((item) => (
                  <div
                    key={item.id}
                    className="border border-zinc-800 bg-zinc-950 rounded-xl p-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          User:{" "}
                          <span className="text-zinc-400">
                            {item.user_id}
                          </span>
                        </p>

                        <p className="text-sm text-zinc-500 mt-1">
                          Task ID: {item.task_id}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.status === "expired"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </span>

                        <p className="text-xs text-zinc-500 mt-2">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}