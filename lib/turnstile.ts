/**
 * Cloudflare Turnstile server-side verification.
 *
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 *
 * Required env vars:
 *   TURNSTILE_SECRET_KEY           — from Cloudflare dashboard (server-only, never expose)
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY — from Cloudflare dashboard (safe to expose client-side)
 *
 * Test keys (already set in .env.local for local dev):
 *   Site key:   1x00000000000000000000AA  → always passes
 *   Secret key: 1x0000000000000000000000000000000AA → always passes
 *   Site key:   2x00000000000000000000AB  → always blocks (use to test failure path)
 *   Secret key: 2x0000000000000000000000000000000AB → always fails
 */

interface TurnstileVerifyResponse {
  success: boolean
  /** ISO 8601 timestamp of the challenge */
  challenge_ts?: string
  /** Hostname of the site the challenge ran on */
  hostname?: string
  /** List of error codes if success is false */
  "error-codes"?: string[]
  /** Action name passed to the widget */
  action?: string
  /** Customer data passed to the widget */
  cdata?: string
}

/**
 * Verify a Turnstile token on the server.
 *
 * @param token     The cf-turnstile-response token from the client widget.
 * @param remoteIp  The visitor's IP address. Optional but recommended — strengthens validation.
 * @returns true if the token is valid, false otherwise.
 */
export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string
): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  // Skip in development if not configured
  if (!secretKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[turnstile] TURNSTILE_SECRET_KEY not set — skipping in dev")
      return true
    }
    console.error("[turnstile] TURNSTILE_SECRET_KEY not set in production — blocking request")
    return false
  }

  if (!token) {
    console.warn("[turnstile] no token provided")
    return false
  }

  // Tokens are max 2048 chars — reject anything larger (potential abuse)
  if (token.length > 2048) {
    console.warn("[turnstile] token exceeds max length")
    return false
  }

  try {
    const body: Record<string, string> = {
      secret: secretKey,
      response: token,
    }
    // Passing the visitor IP lets Cloudflare do stronger validation
    if (remoteIp && remoteIp !== "unknown") {
      body.remoteip = remoteIp
    }

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    )

    if (!res.ok) {
      console.error("[turnstile] siteverify HTTP error:", res.status)
      return false
    }

    const data: TurnstileVerifyResponse = await res.json()

    if (!data.success) {
      console.warn("[turnstile] verification failed:", data["error-codes"])
    }

    return data.success === true
  } catch (err) {
    console.error("[turnstile] verification request failed:", err)
    return false
  }
}
