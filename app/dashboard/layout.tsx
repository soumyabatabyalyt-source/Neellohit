"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabaseClient"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const [dark, setDark] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // Check authentication on mount and whenever session changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push("/login")
          setIsAuthenticated(false)
          return
        }
        setIsAuthenticated(true)
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/login")
        setIsAuthenticated(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push("/login")
        setIsAuthenticated(false)
      } else {
        setIsAuthenticated(true)
      }
    })

    return () => subscription?.unsubscribe()
  }, [router])

  // persist theme
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("theme")
    if (saved === "light") setDark(false)
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("theme", dark ? "dark" : "light")
    }
  }, [dark, mounted])

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen w-full bg-[#05070A] flex items-center justify-center">
        <div className="text-slate-400">Verifying session...</div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null
  }

  const navItems = [
    { name: "Tasks", path: "/dashboard/tasks" },
    { name: "My Tasks", path: "/dashboard/my-tasks/active" },
    { name: "Wallet", path: "/dashboard/wallet" },
    { name: "Account", path: "/dashboard/account" },
  ]

  // Prevent hydration mismatch on theme render
  if (!mounted) return null

  return (
    <div 
      className={`min-h-screen w-full transition-colors duration-500 font-sans overflow-x-hidden ${
        dark 
          ? "bg-[#05070A] text-white selection:bg-red-500/30" 
          : "bg-slate-50 text-slate-900 selection:bg-red-500/20"
      }`}
    >
      {/* 🌟 AMBIENT GLOWS */}
      {dark && (
        <>
          <div className="fixed w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[120px] top-[-20%] left-[-10%] pointer-events-none" />
          <div className="fixed w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[100px] bottom-[-10%] right-[-5%] pointer-events-none" />
        </>
      )}

      {/* 🔥 NAVBAR */}
      <nav 
        className={`fixed top-0 left-0 w-full z-50 backdrop-blur-2xl transition-all duration-300 ${
          dark 
            ? "bg-[#05070A]/80 border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]" 
            : "bg-white/80 border-b border-slate-200 shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex justify-between items-center gap-4">
          
          {/* LEFT: BRAND LOGO */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 flex items-center gap-2 cursor-pointer group w-32"
            onClick={() => router.push("/")}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-all duration-300 ${
              dark ? "bg-red-500 text-white" : "bg-red-500 text-white shadow-lg shadow-red-500/20"
            }`}>
              <span className="font-bold text-lg">N</span>
            </div>
            <h2 className="font-bold text-xl tracking-tight hidden sm:block">
              Nillohit
            </h2>
          </motion.div>

          {/* CENTER: NAV ITEMS (Centered Dock) */}
          <div className="flex-1 flex justify-center overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl border transition-colors ${
              dark ? "bg-white/[0.02] border-white/10" : "bg-slate-100/50 border-slate-200"
            }`}>
              {navItems.map((item) => {
                const active = pathname === item.path

                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.path)}
                    className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap outline-none border ${
                      active 
                        ? (dark ? "border-white/10 text-white" : "border-slate-300 text-slate-900 shadow-sm") 
                        : (dark ? "border-transparent text-slate-400 hover:text-slate-200 hover:border-white/5 hover:bg-white/5" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200 hover:bg-white/50")
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="active-nav-pill"
                        className={`absolute inset-0 rounded-xl border ${
                          dark ? "bg-white/10 border-white/10 shadow-inner shadow-white/5" : "bg-white border-slate-200"
                        }`}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* RIGHT: THEME TOGGLE */}
          <div className="flex-shrink-0 flex items-center justify-end w-32">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setDark(!dark)} 
              className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-center transition-all shadow-sm ${
                dark 
                  ? "bg-white/5 border-white/10 hover:bg-white/10 text-yellow-400 hover:border-white/20" 
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-slate-300"
              }`}
              aria-label="Toggle theme"
            >
              <motion.div
                initial={false}
                animate={{ rotate: dark ? 0 : 180, scale: dark ? 1 : 0.8 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                {dark ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </motion.div>
            </motion.button>
          </div>

        </div>
      </nav>

      {/* 📦 CONTENT WRAPPER */}
      <main className="relative z-10 pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>
      
    </div>
  )
}