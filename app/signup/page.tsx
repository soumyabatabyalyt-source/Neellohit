"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Lock, MessageSquare, Sparkles, UserCircle } from "lucide-react"

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [reddit, setReddit] = useState("")
  const [discord, setDiscord] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!email || !password || !username || !reddit || !discord) {
      alert("Please fill in all fields")
      return
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
        body: JSON.stringify({ email, password, username, reddit, discord }),
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
    <div className="relative min-h-screen bg-[#05070A] flex items-center justify-center overflow-hidden font-sans text-slate-200 selection:bg-orange-500/30 px-4">
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-screen bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-orange-600/30 to-rose-600/10 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
        className="relative z-10 w-full max-w-md p-8 md:p-10 rounded-[2rem] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.05] backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] flex flex-col"
      >
        <div className="text-center mb-10">
          <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.4)] mb-6">
            <Sparkles size={20} className="text-white" />
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
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.05] transition-all duration-300"
            />
          </div>

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.05] transition-all duration-300"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.05] transition-all duration-300"
            />
          </div>

          <div className="relative group">
            <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Reddit account link"
              value={reddit}
              onChange={(e) => setReddit(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.05] transition-all duration-300"
            />
          </div>

          <div className="relative group">
            <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Discord username"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.05] transition-all duration-300"
            />
          </div>
        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] transform hover:-translate-y-0.5 border border-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </motion.div>
    </div>
  )
}
