"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  Check,
  X,
  User,
  Mail,
  ExternalLink,
  ShieldQuestion,
  MessageSquare,
  Calendar,
  Phone,
} from "lucide-react"
import {
  PLATFORMS,
  PLATFORM_LABELS,
  PLATFORM_COLORS,
  PLATFORM_GLYPH,
} from "@/lib/platforms"

// =========================================
// REDDIT URL HELPERS
// =========================================

function redditUsername(raw: string): string {
  try {
    // Parse as URL to strip query params and trailing slashes
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`)
    // pathname looks like /user/Rex_orci-1/ or /u/Rex_orci-1/
    const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean)
    // parts = ["user", "Rex_orci-1"] or ["u", "Rex_orci-1"]
    const idx = parts.findIndex((p) => p === "user" || p === "u")
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1]
    // Fallback: last segment
    return parts[parts.length - 1] || raw
  } catch {
    // Not a valid URL — treat as plain username or u/handle
    return raw.replace(/^\/?u\//, "")
  }
}

function redditProfileUrl(raw: string): string {
  const username = redditUsername(raw)
  return `https://www.reddit.com/user/${username}`
}

// Quora/Facebook handles are always stored as full profile URLs
// (validated at signup). Twitter/X may be a bare @handle instead.
function platformHandleUrl(platform: string, raw: string): string {
  if (raw.startsWith("http")) return raw
  if (platform === "twitter") return `https://x.com/${raw.replace(/^@/, "")}`
  return raw
}

// =========================================
// COMPONENT
// =========================================

export default function Accounts() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, username, email, reddit, discord, whatsapp, platforms, quora, facebook, twitter, created_at, approval_status, approved"
      )
      .or("approved.eq.false,approval_status.eq.pending")
      .order("created_at", { ascending: true })

    if (error) {
      console.error(error)
    }
    setUsers(data || [])
    setLoading(false)
  }

  // =========================================
  // APPROVE
  // =========================================

  const approveUser = async (id: string) => {
    try {
      const res = await fetch("/api/manager/accounts/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, action: "approve" }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert("Approval failed: " + (data.error || "Unknown error"))
        return
      }
      load()
    } catch {
      alert("Approval failed")
    }
  }

  // =========================================
  // REJECT
  // =========================================

  const rejectUser = async (id: string) => {
    const confirmed = confirm("Reject and delete this account?")
    if (!confirmed) return

    // Profiles has RLS with no client-side DELETE policy (by design —
    // only the service role should be able to remove accounts), so
    // this has to go through the server action route instead of a
    // direct supabase.from("profiles").delete() call.
    try {
      const res = await fetch("/api/manager/accounts/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, action: "reject" }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert("Rejection failed: " + (data.error || "Unknown error"))
        return
      }
      load()
    } catch {
      alert("Rejection failed")
    }
  }

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full font-sans">

      {/* HEADER */}
      <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          Pending Accounts
          {!loading && users.length > 0 && (
            <span className="bg-amber-500/20 text-amber-400 text-sm py-1 px-3 rounded-full font-medium border border-amber-500/20">
              {users.length} Awaiting
            </span>
          )}
        </h2>
        <p className="text-slate-400 mt-1 text-sm">
          Review and approve new users before they can access the platform.
        </p>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="py-16 flex items-center justify-center text-slate-500 animate-pulse">
          Loading...
        </div>
      ) : users.length === 0 ? (
        /* EMPTY */
        <div className="py-16 px-6 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center bg-white/[0.01] animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-inner">
            <ShieldQuestion className="text-slate-500" size={32} />
          </div>
          <p className="text-lg font-medium text-slate-300">No pending accounts</p>
          <p className="text-slate-500 text-sm mt-1 max-w-sm">
            All users have been reviewed. Check back later for new registrations.
          </p>
        </div>
      ) : (
        /* USER LIST */
        <div className="grid gap-5">
          {users.map((u) => (
            <div
              key={u.id}
              className="
                rounded-2xl border-2 border-white/15 bg-white/[0.03]
                backdrop-blur-sm shadow-lg
                hover:bg-white/[0.05] hover:border-white/25
                transition-all duration-300
                animate-in fade-in zoom-in-95 duration-200
                overflow-hidden
              "
            >
              {/* CARD BODY */}
              <div className="p-5 sm:p-6 flex flex-col gap-5">

                {/* TOP: Username + Joined date */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <User size={18} className="text-slate-400 shrink-0" />
                      {u.username || "Unknown User"}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 tracking-wider bg-black/40 inline-block px-2 py-0.5 rounded border border-white/5">
                      ID: {u.id}
                    </p>
                  </div>
                  {u.created_at && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                      <Calendar size={13} />
                      Registered {new Date(u.created_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </div>
                  )}
                </div>

                {/* INFO GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {/* Email */}
                  <div className="flex items-center gap-3 bg-black/20 rounded-xl px-4 py-3 border border-white/8 min-w-0">
                    <Mail size={16} className="text-slate-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Email</p>
                      <p className="text-sm text-slate-200 truncate">{u.email || "—"}</p>
                    </div>
                  </div>

                  {/* Discord */}
                  <div className="flex items-center gap-3 bg-black/20 rounded-xl px-4 py-3 border border-white/8 min-w-0">
                    <MessageSquare size={16} className="text-indigo-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Discord</p>
                      <p className="text-sm text-slate-200 truncate">{u.discord || "—"}</p>
                    </div>
                  </div>

                  {/* Reddit */}
                  <div className="flex items-center gap-3 bg-black/20 rounded-xl px-4 py-3 border border-white/8 min-w-0 sm:col-span-2">
                    <div className="w-4 h-4 rounded-full bg-[#FF4500]/20 flex items-center justify-center shrink-0">
                      <span className="text-[10px] text-[#FF4500] font-bold">R</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Reddit</p>
                      {u.reddit ? (
                        <a
                          href={redditProfileUrl(u.reddit)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1.5 font-medium w-fit max-w-full"
                        >
                          <span className="truncate">u/{redditUsername(u.reddit)}</span>
                          <ExternalLink size={12} className="shrink-0 opacity-60" />
                        </a>
                      ) : (
                        <span className="text-sm text-slate-500 italic">Not provided</span>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="flex items-center gap-3 bg-black/20 rounded-xl px-4 py-3 border border-white/8 min-w-0">
                    <Phone size={16} className="text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">WhatsApp</p>
                      <p className="text-sm text-slate-200 truncate">{u.whatsapp || "—"}</p>
                    </div>
                  </div>

                  {/* Platforms selected */}
                  <div className="flex items-center gap-3 bg-black/20 rounded-xl px-4 py-3 border border-white/8 min-w-0">
                    <div className="min-w-0 w-full">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Working On</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(u.platforms || ["reddit"]).map((p: string) => (
                          <span
                            key={p}
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                            style={{
                              color: PLATFORM_COLORS[p as keyof typeof PLATFORM_COLORS] || "#94a3b8",
                              borderColor: `${PLATFORM_COLORS[p as keyof typeof PLATFORM_COLORS] || "#94a3b8"}40`,
                              backgroundColor: `${PLATFORM_COLORS[p as keyof typeof PLATFORM_COLORS] || "#94a3b8"}15`,
                            }}
                          >
                            {PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS] || p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Non-Reddit platform handles — only for platforms this user opted into */}
                  {PLATFORMS.filter((p) => p !== "reddit" && u[p]).map((p) => (
                    <div key={p} className="flex items-center gap-3 bg-black/20 rounded-xl px-4 py-3 border border-white/8 min-w-0 sm:col-span-2">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${PLATFORM_COLORS[p]}20` }}
                      >
                        <span className="text-[10px] font-bold" style={{ color: PLATFORM_COLORS[p] }}>
                          {PLATFORM_GLYPH[p]}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">{PLATFORM_LABELS[p]}</p>
                        <a
                          href={platformHandleUrl(p, u[p])}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1.5 font-medium w-fit max-w-full"
                        >
                          <span className="truncate">{u[p]}</span>
                          <ExternalLink size={12} className="shrink-0 opacity-60" />
                        </a>
                      </div>
                    </div>
                  ))}

                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => approveUser(u.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                  >
                    <Check size={17} />
                    Approve
                  </button>
                  <button
                    onClick={() => rejectUser(u.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 hover:border-rose-500 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200"
                  >
                    <X size={17} />
                    Reject
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
