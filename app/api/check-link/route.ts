import { NextResponse } from "next/server"

/**
 * Non-Reddit link checker only.
 * Reddit links are checked client-side (browser) to avoid datacenter IP blocks.
 */
export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url")
  if (!url) return NextResponse.json({ error: "Missing url param" }, { status: 400 })

  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(8000),
    })
    return NextResponse.json({ ok: res.ok, reason: res.ok ? "Live" : `HTTP ${res.status}` })
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      reason: err.name === "TimeoutError" ? "Timed out" : "Unreachable",
    })
  }
}
