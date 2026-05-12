// app/admin/layout.tsx

"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Wallet,
  Settings,
  LogOut,
  Shield,
} from "lucide-react"

import { supabase } from "@/lib/supabaseClient"

const navItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Tasks",
    href: "/admin/tasks",
    icon: ClipboardList,
  },
  {
    name: "Withdrawals",
    href: "/admin/withdrawals",
    icon: Wallet,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdmin()
  }, [])

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const role = profile?.role?.trim()?.toLowerCase()

    if (error || role !== "admin") {
      router.push("/dashboard")
      return
    }

    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-lg">
          Loading admin panel...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-white flex">
      {/* Sidebar */}
      <aside className="w-72 bg-zinc-950 border-r border-zinc-800 hidden md:flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>

            <div>
              <h1 className="text-xl font-bold">Neellohit</h1>
              <p className="text-zinc-400 text-sm">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition ${
                  active
                    ? "bg-white text-black"
                    : "hover:bg-zinc-900 text-zinc-300"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-2xl transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 z-50">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <span className="font-semibold">Admin Panel</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:ml-0 mt-16 md:mt-0">
        {children}
      </main>
    </div>
  )
}