"use client"

import { useState, useRef } from "react"
import { Plus, Trash2, RefreshCw, ExternalLink, CheckCircle, XCircle, Clock, Link2 } from "lucide-react"

type LinkResult = {
  id: string
  url: string
  status: "pending" | "checking" | "live" | "dead" | "error" | "manual"
  statusCode: number | null
  reason: string | null
  checkedAt: Date | null
}

function makeId() {
  return Math.random().toString(36).slice(2)
}

function StatusBadge({ status, reason }: { status: LinkResult["status"]; reason: string | null }) {
  if (status === "pending") return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/20">
      <Clock size={11} /> Not checked
    </span>
  )
  if (status === "checking") return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/20">
      <RefreshCw size={11} className="animate-spin" /> Checking...
    </span>
  )
  if (status === "live") return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/20">
      <CheckCircle size={11} /> Live
    </span>
  )
  if (status === "manual") return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
      <ExternalLink size={11} /> Check manually
    </span>
  )
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/20" title={reason || ""}>
      <XCircle size={11} /> {reason || "Dead"}
    </span>
  )
}

function isRedditUrl(url: string) {
  return /reddit\.com\/r\//i.test(url)
}

// Reddit blocks all automated checks (CORS from browser, IP blocks from server).
// Reddit links are marked "manual" — manager opens and marks them.
async function checkUrl(url: string): Promise<{ status: "live" | "dead" | "error" | "manual"; code: number | null; reason: string | null }> {
  if (isRedditUrl(url)) {
    return { status: "manual", code: null, reason: "Open link to verify" }
  }
  try {
    const res = await fetch(`/api/check-link?url=${encodeURIComponent(url)}`)
    const data = await res.json()
    return { status: data.ok ? "live" : "dead", code: null, reason: data.reason ?? null }
  } catch {
    return { status: "error", code: null, reason: "Network error" }
  }
}

export default function LinkCheckerPage() {
  const [links, setLinks] = useState<LinkResult[]>([])
  const [input, setInput] = useState("")
  const [checkingAll, setCheckingAll] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function addLinks() {
    const raw = input.trim()
    if (!raw) return
    // Support multiple lines or comma-separated
    const urls = raw.split(/[\n,]+/).map(u => u.trim()).filter(u => u.length > 0)
    const newLinks: LinkResult[] = urls.map(url => ({
      id: makeId(),
      url: url.startsWith("http") ? url : `https://${url}`,
      status: "pending",
      statusCode: null,
      reason: null,
      checkedAt: null,
    }))
    setLinks(prev => [...prev, ...newLinks])
    setInput("")
    inputRef.current?.focus()
  }

  function removeLink(id: string) {
    setLinks(prev => prev.filter(l => l.id !== id))
  }

  function clearAll() {
    setLinks([])
  }

  async function checkSingle(id: string) {
    const link = links.find(l => l.id === id)
    if (!link) return
    setLinks(prev => prev.map(l => l.id === id ? { ...l, status: "checking" } : l))
    const result = await checkUrl(link.url)
    setLinks(prev => prev.map(l =>
      l.id === id
        ? { ...l, status: result.status === "error" ? "error" : result.status, statusCode: result.code, reason: result.reason, checkedAt: new Date() }
        : l
    ))
  }

  async function checkAll() {
    setCheckingAll(true)
    const pending = links.filter(l => l.status !== "checking")
    // Check all concurrently
    await Promise.all(pending.map(l => checkSingle(l.id)))
    setCheckingAll(false)
  }

  const liveCount = links.filter(l => l.status === "live").length
  const deadCount = links.filter(l => l.status === "dead" || l.status === "error").length

  return (
    <div className="space-y-6 max-w-4xl">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-white">Link Checker</h1>
        <p className="text-slate-400 text-sm mt-1">
          Paste Reddit links to check if they're live. Supports multiple links at once.
        </p>
      </div>

      {/* INPUT */}
      <div className="p-5 rounded-2xl bg-white/[0.03] border-2 border-white/10 space-y-3">
        <label className="text-sm font-medium text-slate-300">
          Add links to check
        </label>
        <textarea
          ref={inputRef as any}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addLinks()
          }}
          placeholder={"https://reddit.com/r/...\nhttps://reddit.com/r/...\n\nPaste one per line, or comma-separated"}
          rows={4}
          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 resize-none font-mono"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={addLinks}
            disabled={!input.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border-2 border-blue-400/40 text-blue-300 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={15} /> Add Links
          </button>
          <span className="text-xs text-slate-500">or Ctrl+Enter</span>
        </div>
      </div>

      {/* ACTIONS + STATS */}
      {links.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-400">{links.length} link{links.length !== 1 ? "s" : ""}</span>
            {liveCount > 0 && <span className="text-green-400 font-semibold">{liveCount} live</span>}
            {deadCount > 0 && <span className="text-red-400 font-semibold">{deadCount} dead</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={checkAll}
              disabled={checkingAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/15 hover:bg-green-500/25 border-2 border-green-500/30 text-green-300 text-sm font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={checkingAll ? "animate-spin" : ""} />
              Check All
            </button>
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/20 text-red-400 text-sm font-semibold transition-all"
            >
              <Trash2 size={14} /> Clear All
            </button>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map(link => (
            <div
              key={link.id}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                link.status === "live"
                  ? "bg-green-500/5 border-green-500/20"
                  : link.status === "dead" || link.status === "error"
                  ? "bg-red-500/5 border-red-500/20"
                  : "bg-white/[0.02] border-white/10"
              }`}
            >
              {/* URL */}
              <div className="flex-1 min-w-0">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors truncate"
                >
                  <Link2 size={13} className="flex-shrink-0" />
                  <span className="truncate">{link.url}</span>
                  <ExternalLink size={11} className="flex-shrink-0 opacity-60" />
                </a>
                {link.checkedAt && (
                  <p className="text-xs text-slate-600 mt-0.5">
                    Checked {link.checkedAt.toLocaleTimeString()}
                  </p>
                )}
              </div>

              {/* STATUS */}
              <StatusBadge status={link.status} reason={link.reason} />

              {/* ACTIONS */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Manual mark buttons for Reddit links */}
                {(link.status === "manual" || (isRedditUrl(link.url) && (link.status === "live" || link.status === "dead"))) && (
                  <>
                    <button
                      onClick={() => setLinks(prev => prev.map(l => l.id === link.id ? { ...l, status: "live", reason: "Manually marked live", checkedAt: new Date() } : l))}
                      title="Mark as Live"
                      className="px-2 py-1 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-400 text-xs font-semibold transition-all border border-green-500/20"
                    >
                      ✓ Live
                    </button>
                    <button
                      onClick={() => setLinks(prev => prev.map(l => l.id === link.id ? { ...l, status: "dead", reason: "Manually marked dead", checkedAt: new Date() } : l))}
                      title="Mark as Dead"
                      className="px-2 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-semibold transition-all border border-red-500/20"
                    >
                      ✗ Dead
                    </button>
                  </>
                )}
                {!isRedditUrl(link.url) && (
                  <button
                    onClick={() => checkSingle(link.id)}
                    disabled={link.status === "checking"}
                    title="Re-check"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-40"
                  >
                    <RefreshCw size={13} className={link.status === "checking" ? "animate-spin" : ""} />
                  </button>
                )}
                <button
                  onClick={() => removeLink(link.id)}
                  title="Remove"
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {links.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-600 border-2 border-dashed border-white/5 rounded-2xl">
          <Link2 size={32} className="mb-3 opacity-30" />
          <p className="text-sm">Paste some links above to get started</p>
        </div>
      )}

    </div>
  )
}
