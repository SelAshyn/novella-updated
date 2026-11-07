import { getRedis } from "./redis";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiter for API routes.
 *
 * Uses Redis (Upstash) when configured — creates a per-call Ratelimit instance
 * so that each route's `limit` and `windowMs` are honoured correctly.
 * Falls back to an in-memory sliding-window Map when Redis is unavailable.
 */

// In-memory fallback
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const store = new Map<string, RateLimitEntry>();

// Cache Upstash Redis client so we only init it once
const upstashRedisClient: Redis | null = (() => {
  const c = getRedis();
  return c instanceof Redis ? c : null;
})();

// Cache Ratelimit instances per limit:windowSeconds pair to reuse scripts and connections
const ratelimitInstances = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowSeconds: number): Ratelimit | null {
  if (!upstashRedisClient) return null;
  const configKey = `${limit}:${windowSeconds}`;
  let instance = ratelimitInstances.get(configKey);
  if (!instance) {
    instance = new Ratelimit({
      redis: upstashRedisClient,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: `rl:${configKey}`,
    });
    ratelimitInstances.set(configKey, instance);
  }
  return instance;
}

// Clean up expired entries every 5 minutes (in-memory fallback only)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfter: number;
}

/**
 * Check whether a key has exceeded the rate limit.
 *
 * Each call respects the per-route `limit` and `windowMs` values.
 *
 * @param key      Unique identifier (e.g. "endpoint:ip").
 * @param limit    Max requests allowed in the window.
 * @param windowMs Window size in milliseconds.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  // 1. Upstash Redis path — reuse cached limiter per (limit, windowSeconds) pair.
  if (upstashRedisClient) {
    try {
      const windowSeconds = Math.max(1, Math.round(windowMs / 1000));
      const limiter = getUpstashLimiter(limit, windowSeconds);
      if (limiter) {
        const { success, remaining, reset } = await limiter.limit(key);
        return {
          success,
          remaining,
          retryAfter: Math.max(0, Math.ceil((reset - Date.now()) / 1000)),
        };
      }
    } catch (err) {
      console.error("[rate-limit] Upstash error, gracefully falling back to in-memory:", err);
      // Fall through to in-memory fallback
    }
  }

  // 2. Fallback to in-memory store
  const now = Date.now();
  const entry = store.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + windowMs;
  } else {
    entry.count++;
  }

  store.set(key, entry);

  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    retryAfter: entry.count > limit ? Math.ceil((entry.resetAt - now) / 1000) : 0,
  };
}

/**
 * Extract the real client IP from a Next.js request.
 * Respects Cloudflare's CF-Connecting-IP header when present.
 */
export function getClientIp(req: Request): string {
  // Cloudflare sets this when proxying
  const cf = (req.headers as any).get?.("cf-connecting-ip")
  if (cf) return cf

  const forwarded = (req.headers as any).get?.("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()

  const real = (req.headers as any).get?.("x-real-ip")
  if (real) return real

  return "unknown"
}

/**
 * Return a standard 429 response with Retry-After header.
 */
export function rateLimitResponse(retryAfter: number) {
  return new Response(
    JSON.stringify({
      error: `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  )
}
