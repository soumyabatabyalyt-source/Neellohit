// =========================================
// SIGNUP FIELD VALIDATION
//
// Shared between the signup form (client-side, for instant
// feedback) and /api/signup (server-side, the real gate — never
// trust the client). Keep both in sync.
// =========================================

import type { Platform } from "@/lib/platforms"

// E.164-ish: a leading "+", a country code that doesn't start
// with 0, then enough digits for a real mobile number.
// e.g. +14155552671, +919876543210
const WHATSAPP_RE = /^\+[1-9]\d{7,14}$/

export function isValidWhatsApp(value: string): boolean {
  return WHATSAPP_RE.test(value.trim())
}

// Reddit accepts either a bare username or a profile URL/path —
// matches what app/manager/accounts/page.tsx already parses.
const REDDIT_USERNAME_RE = /^[A-Za-z0-9_-]{3,20}$/

export function isValidReddit(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  if (v.startsWith("http")) {
    try {
      const url = new URL(v)
      return /(^|\.)reddit\.com$/.test(url.hostname)
    } catch {
      return false
    }
  }
  return REDDIT_USERNAME_RE.test(v.replace(/^\/?u\//, ""))
}

function isUrlOnHost(value: string, hosts: RegExp): boolean {
  const v = value.trim()
  if (!v.startsWith("http")) return false
  try {
    const url = new URL(v)
    return hosts.test(url.hostname)
  } catch {
    return false
  }
}

export function isValidQuora(value: string): boolean {
  return isUrlOnHost(value, /(^|\.)quora\.com$/)
}

export function isValidFacebook(value: string): boolean {
  return isUrlOnHost(value, /(^|\.)facebook\.com$/)
}

// Twitter/X handle: either a profile URL on twitter.com/x.com, or
// a bare @handle.
const TWITTER_HANDLE_RE = /^@?[A-Za-z0-9_]{1,15}$/

export function isValidTwitter(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  if (v.startsWith("http")) {
    return isUrlOnHost(v, /(^|\.)(twitter|x)\.com$/)
  }
  return TWITTER_HANDLE_RE.test(v)
}

export const PLATFORM_HANDLE_VALIDATORS: Record<
  Exclude<Platform, "reddit">,
  (value: string) => boolean
> = {
  quora: isValidQuora,
  facebook: isValidFacebook,
  twitter: isValidTwitter,
}

export const PLATFORM_HANDLE_HINTS: Record<Exclude<Platform, "reddit">, string> = {
  quora: "Must be a quora.com profile link",
  facebook: "Must be a facebook.com profile link",
  twitter: "A twitter.com/x.com link, or an @handle",
}
