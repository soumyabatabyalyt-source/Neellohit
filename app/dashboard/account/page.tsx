"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { motion } from "framer-motion"

import {
  Loader2,
  UserCircle,
  Mail,
  MessageSquare,
  LogOut,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react"

export default function Account() {

  const [profile, setProfile] =
    useState<any>(null)

  const [copied, setCopied] =
    useState(false)

  useEffect(() => {

    const load = async () => {

      const {
        data: userData,
      } = await supabase.auth.getUser()

      const user =
        userData.user

      if (!user) return

      const { data } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

      setProfile(data)
    }

    load()

  }, [])

  // =========================================
  // COPY EMAIL
  // =========================================

  async function copyEmail() {

    if (!profile?.email)
      return

    await navigator.clipboard.writeText(
      profile.email
    )

    setCopied(true)

    setTimeout(() => {

      setCopied(false)

    }, 2000)
  }

  // =========================================
  // LOADING
  // =========================================

  if (!profile) {

    return (

      <div className="flex flex-col items-center justify-center py-24 font-sans text-slate-200">

        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">

          <Loader2
            className="animate-spin text-blue-400"
            size={28}
          />

        </div>

        <p className="text-slate-400 font-light tracking-wide animate-pulse">
          Loading profile...
        </p>

      </div>
    )
  }

  return (

    <div className="w-full max-w-4xl mx-auto font-sans text-slate-200">

      {/* HEADER */}
      <div className="mb-10">

        <h1 className="text-4xl font-black tracking-tight text-white">

          Your{" "}

          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
            Account
          </span>

        </h1>

        <p className="text-slate-400 mt-3 text-sm leading-relaxed">
          Manage your profile details, linked accounts, and session access.
        </p>

      </div>

      {/* PROFILE CARD */}
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
          type: "spring",
          stiffness: 80,
        }}
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
      >

        {/* GLOW */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none transform translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 p-6 md:p-10">

          {/* TOP SECTION */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-8 border-b border-white/10">

            {/* AVATAR */}
            <div className="relative">

              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center shadow-xl shadow-blue-500/10">

                <UserCircle
                  size={52}
                  className="text-blue-400"
                />

              </div>

              {/* ONLINE DOT */}
              <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-400 border-4 border-[#0B1120] shadow-[0_0_15px_rgba(74,222,128,0.7)]" />

            </div>

            {/* INFO */}
            <div className="flex-1">

              <div className="flex flex-wrap items-center gap-3 mb-3">

                <h2 className="text-3xl font-bold text-white tracking-tight">
                  Profile Details
                </h2>

                {profile.role && (

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">

                    <ShieldCheck size={14} />

                    {profile.role}

                  </span>
                )}

              </div>

              <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
                Your account credentials and connected platform details.
              </p>

            </div>

          </div>

          {/* INFO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">

            {/* EMAIL */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 hover:bg-black/30 transition-all duration-300">

              <div className="absolute inset-y-0 left-0 w-1 bg-blue-500/60" />

              <div className="p-5 flex items-center justify-between gap-4">

                <div className="flex items-center gap-4 min-w-0">

                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">

                    <Mail
                      size={24}
                      className="text-blue-400"
                    />

                  </div>

                  <div className="min-w-0">

                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Email Address
                    </p>

                    <p className="text-slate-100 font-medium truncate">
                      {profile.email}
                    </p>

                  </div>

                </div>

                {/* COPY */}
                <button
                  onClick={copyEmail}
                  className="shrink-0 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >

                  {copied ? (

                    <Check
                      size={18}
                      className="text-emerald-400"
                    />

                  ) : (

                    <Copy
                      size={18}
                      className="text-slate-400"
                    />
                  )}

                </button>

              </div>

            </div>

            {/* REDDIT */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 hover:bg-black/30 transition-all duration-300">

              <div className="absolute inset-y-0 left-0 w-1 bg-orange-500/70" />

              <div className="p-5 flex items-center gap-4">

                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">

                  <MessageSquare
                    size={24}
                    className="text-orange-400"
                  />

                </div>

                <div className="min-w-0">

                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Reddit Account
                  </p>

                  <p className="text-slate-100 font-medium truncate">
                    {profile.reddit ||
                      "Not connected"}
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* LOGOUT */}
          <div className="pt-8 mt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>

              <h3 className="text-white font-semibold">
                Active Session
              </h3>

              <p className="text-slate-400 text-sm mt-1">
                Logout securely from your account.
              </p>

            </div>

            <button
              onClick={async () => {

                await supabase.auth.signOut()

                location.href =
                  "/login"

              }}
              className="px-8 py-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(244,63,94,0.18)]"
            >

              <LogOut size={18} />

              Logout Safely

            </button>

          </div>

        </div>

      </motion.div>

    </div>
  )
}