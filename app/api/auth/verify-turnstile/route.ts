import { NextRequest, NextResponse } from "next/server";
import { verifyTurnstile } from "@/lib/turnstile";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

/**
 * Verifies a Cloudflare Turnstile token and enforces per-IP rate limits
 * for sign-in, sign-up, and forgot-password flows.
 *
 * The client calls this before any Firebase auth operation.
 * On success the client proceeds; on failure it shows an error.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  let body: { token?: string; action?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const { token, action = "auth" } = body

  // ── Per-IP rate limits ────────────────────────────────────────────────────
  // These are intentionally strict — a real user will never hit them.
  const limits: Record<string, { limit: number; windowMs: number }> = {
    "sign-in":         { limit: 10, windowMs: 15 * 60 * 1000 },  // 10 per 15 min
    "sign-up":         { limit: 5,  windowMs: 60 * 60 * 1000 },  // 5 per hour
    "forgot-password": { limit: 5,  windowMs: 60 * 60 * 1000 },  // 5 per hour
    "auth":            { limit: 20, windowMs: 15 * 60 * 1000 },  // fallback
  }

  const config = limits[action] ?? limits["auth"]
  const result = await rateLimit(`${action}:${ip}`, config.limit, config.windowMs)

  if (!result.success) {
    return rateLimitResponse(result.retryAfter)
  }

  // ── Turnstile verification ────────────────────────────────────────────────
  // Pass the visitor IP to Cloudflare for stronger validation
  const valid = await verifyTurnstile(token, ip)
  if (!valid) {
    return NextResponse.json(
      { error: "Security check failed. Please try again." },
      { status: 403 }
    )
  }

  return NextResponse.json({ success: true })
}
