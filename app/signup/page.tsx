"use client"

import { useState } from "react"
import { Mail, Lock, MessageSquare, Sparkles, UserCircle, Phone } from "lucide-react"
import { useTheme } from "@/lib/useTheme"
import {
  PLATFORMS,
  type Platform,
  PLATFORM_LABELS,
} from "@/lib/platforms"
import {
  isValidWhatsApp,
  isValidReddit,
  PLATFORM_HANDLE_VALIDATORS,
  PLATFORM_HANDLE_HINTS,
} from "@/lib/validation"

const OPTIONAL_PLATFORMS = PLATFORMS.filter((p) => p !== "reddit")

const PLATFORM_HANDLE_PLACEHOLDER: Record<string, string> = {
  quora: "https://www.quora.com/profile/...",
  facebook: "https://www.facebook.com/...",
  twitter: "@handle or https://x.com/...",
}

export default function Signup() {
  const { dark, mounted } = useTheme()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [reddit, setReddit] = useState("")
  const [discord, setDiscord] = useState("")
  // Reddit is mandatory on every account — it's always selected and
  // can't be unchecked. Quora/Facebook/Twitter are opt-in: only
  // taskers who want to work on that platform fill in its handle.
  const [platforms, setPlatforms] = useState<Platform[]>(["reddit"])
  const [handles, setHandles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // ✅ Move conditional rendering into JSX, not early return
  if (!mounted) return null

  function togglePlatform(p: Platform) {
    if (p === "reddit") return // mandatory, can't be turned off
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  const handleSignup = async () => {
    if (!email || !password || !username || !reddit || !discord || !whatsapp) {
      alert("Please fill in all fields")
      return
    }

    if (!isValidWhatsApp(whatsapp)) {
      alert("WhatsApp number must include a country code, e.g. +14155552671")
      return
    }

    if (!isValidReddit(reddit)) {
      alert("Please enter a valid Reddit username or profile link")
      return
    }

    for (const p of OPTIONAL_PLATFORMS) {
      if (!platforms.includes(p)) continue
      const value = (handles[p] || "").trim()
      if (!value) {
        alert(`Please enter your ${PLATFORM_LABELS[p]} account for the platforms you selected`)
        return
      }
      if (!PLATFORM_HANDLE_VALIDATORS[p](value)) {
        alert(`${PLATFORM_LABELS[p]}: ${PLATFORM_HANDLE_HINTS[p]}`)
        return
      }
    }

    setLoading(true)

    try {
      // Signup runs server-side: public.profiles has RLS enabled with no
      // insert policy, so a browser insert with the anon key gets rejected
      // and leaves an orphan auth user behind. /api/signup uses the service
      // role key and rolls the auth user back if profile insert fails.
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          username,
          reddit,
          discord,
          whatsapp,
          platforms,
          quora: platforms.includes("quora") ? handles.quora?.trim() : null,
          facebook: platforms.includes("facebook") ? handles.facebook?.trim() : null,
          twitter: platforms.includes("twitter") ? handles.twitter?.trim() : null,
        }),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json.success) {
        console.error("SIGNUP FAILED:", json)
        alert(json?.error || "Signup failed")
        return
      }

      // Redirect to pending approval page
      window.location.href = `/pending-approval?email=${encodeURIComponent(email)}`
    } catch (err) {
      console.error(err)
      alert("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`relative min-h-screen flex items-center justify-center overflow-hidden font-sans px-4 transition-colors duration-500 ${
      dark
        ? "bg-[#0f0814] text-slate-200 selection:bg-orange-500/30"
        : "bg-[#fafaf8] text-slate-800 selection:bg-red-500/20"
    }`}>

      {/* HOME BUTTON WITH LOGO */}
      <button
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/'
          }
        }}
        className={`
          fixed
          top-6
          left-6
          z-50
          flex
          items-center
          gap-2
          px-4
          py-2
          rounded-full
          font-semibold
          text-sm
          transition-all
          hover:scale-105
          ${dark
            ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/50"
            : "bg-red-600 text-white hover:bg-red-700"}
        `}
      >
        <img src="/logo-icon.png" alt="Neellohit" className="w-6 h-6" />
        Home
      </button>
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-screen bg-[url('/noise.svg')]" />
      <div
        className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-orange-600/30 to-rose-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none animate-pulse"
      />

      <div
        className={`relative z-10 w-full max-w-md p-8 md:p-10 rounded-[2rem] border-2 backdrop-blur-2xl flex flex-col transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 duration-400 ${
          dark
            ? "bg-[#7f1d1d] border-black shadow-[0_0_40px_rgba(239,68,68,0.2)] hover:shadow-[0_0_60px_rgba(239,68,68,0.3)]"
            : "bg-[#7f1d1d] border-black shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]"
        }`}
      >
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 mb-6 flex items-center justify-center">
            <img src="/logo-md.png" alt="Neellohit" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Join the Elite</h1>
          <p className="text-slate-400 text-sm font-light">Create your account to start earning.</p>
        </div>

        <div className="space-y-5 mb-8">
          <div className="relative group">
            <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full border rounded-xl pl-11 pr-4 py-3.5 focus:outline-none transition-all duration-300 ${
                dark
                  ? "bg-white/[0.03] border-white/10 text-slate-200 placeholder-slate-500 focus:border-orange-500/50 focus:bg-white/[0.05]"
                  : "bg-white/60 border-red-500/30 text-slate-900 placeholder-slate-500 focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500/30"
              }`}
            />
          </div>

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full border rounded-xl pl-11 pr-4 py-3.5 focus:outline-none transition-all duration-300 ${
                dark
                  ? "bg-white/[0.03] border-white/10 text-slate-200 placeholder-slate-500 focus:border-orange-500/50 focus:bg-white/[0.05]"
                  : "bg-white/60 border-red-500/30 text-slate-900 placeholder-slate-500 focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500/30"
              }`}
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full border rounded-xl pl-11 pr-4 py-3.5 focus:outline-none transition-all duration-300 ${
                dark
                  ? "bg-white/[0.03] border-white/10 text-slate-200 placeholder-slate-500 focus:border-orange-500/50 focus:bg-white/[0.05]"
                  : "bg-white/60 border-red-500/30 text-slate-900 placeholder-slate-500 focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500/30"
              }`}
            />
          </div>

          <div className="relative group">
            <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Reddit account link"
              value={reddit}
              onChange={(e) => setReddit(e.target.value)}
              className={`w-full border rounded-xl pl-11 pr-4 py-3.5 focus:outline-none transition-all duration-300 ${
                dark
                  ? "bg-white/[0.03] border-white/10 text-slate-200 placeholder-slate-500 focus:border-orange-500/50 focus:bg-white/[0.05]"
                  : "bg-white/60 border-red-500/30 text-slate-900 placeholder-slate-500 focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500/30"
              }`}
            />
          </div>

          <div className="relative group">
            <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Discord username"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              className={`w-full border rounded-xl pl-11 pr-4 py-3.5 focus:outline-none transition-all duration-300 ${
                dark
                  ? "bg-white/[0.03] border-white/10 text-slate-200 placeholder-slate-500 focus:border-orange-500/50 focus:bg-white/[0.05]"
                  : "bg-white/60 border-red-500/30 text-slate-900 placeholder-slate-500 focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500/30"
              }`}
            />
          </div>

          <div className="relative group">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input
              type="tel"
              placeholder="WhatsApp number, e.g. +14155552671"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className={`w-full border rounded-xl pl-11 pr-4 py-3.5 focus:outline-none transition-all duration-300 ${
                dark
                  ? "bg-white/[0.03] border-white/10 text-slate-200 placeholder-slate-500 focus:border-orange-500/50 focus:bg-white/[0.05]"
                  : "bg-white/60 border-red-500/30 text-slate-900 placeholder-slate-500 focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500/30"
              }`}
            />
          </div>

          {/* PLATFORM SELECTION — which platforms this tasker wants
              to work on. Reddit is locked on (mandatory); the rest
              are opt-in and each reveals its own handle field below. */}
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase text-slate-400 mb-2 px-1">
              Platforms you want to work on
            </p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const active = platforms.includes(p)
                const locked = p === "reddit"
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    disabled={locked}
                    title={locked ? "Reddit is required for every account" : undefined}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                      active
                        ? "bg-orange-500/90 border-orange-400 text-white"
                        : "bg-white/[0.03] border-white/15 text-slate-300 hover:bg-white/10"
                    } ${locked ? "cursor-not-allowed opacity-90" : ""}`}
                  >
                    {PLATFORM_LABELS[p]}
                    {locked ? " (required)" : ""}
                  </button>
                )
              })}
            </div>
          </div>

          {/* One handle field per selected non-Reddit platform */}
          {OPTIONAL_PLATFORMS.filter((p) => platforms.includes(p)).map((p) => (
            <div className="relative group" key={p}>
              <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder={PLATFORM_HANDLE_PLACEHOLDER[p]}
                value={handles[p] || ""}
                onChange={(e) => setHandles((prev) => ({ ...prev, [p]: e.target.value }))}
                className={`w-full border rounded-xl pl-11 pr-4 py-3.5 focus:outline-none transition-all duration-300 ${
                  dark
                    ? "bg-white/[0.03] border-white/10 text-slate-200 placeholder-slate-500 focus:border-orange-500/50 focus:bg-white/[0.05]"
                    : "bg-white/60 border-red-500/30 text-slate-900 placeholder-slate-500 focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500/30"
                }`}
              />
              <p className="text-[11px] text-slate-500 mt-1 px-1">
                {PLATFORM_LABELS[p]} account — {PLATFORM_HANDLE_HINTS[p]}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          className={`w-full px-8 py-4 rounded-xl text-white font-semibold transition-all duration-300 transform hover:-translate-y-0.5 border disabled:opacity-60 disabled:cursor-not-allowed ${
            dark
              ? "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] border-white/10"
              : "bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_40px_rgba(239,68,68,0.3)] border-black"
          }`}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </div>
    </div>
  )
}
