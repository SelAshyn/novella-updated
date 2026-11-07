import { Redis as UpstashRedis } from "@upstash/redis";
import Redis from "ioredis";

// Unified Redis client instance
let redisInstance: UpstashRedis | Redis | null = null;

export function getRedis() {
  if (redisInstance) return redisInstance;

  // Try Upstash REST first
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisInstance = new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return redisInstance;
  }

  // Try standard ioredis
  if (process.env.REDIS_URL) {
    redisInstance = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1, // Don't block requests if Redis is down
    });
    return redisInstance;
  }

  return null;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedis();
    if (!client) return null;
    const value = (await client.get(key)) as string | null;
    return value ? (JSON.parse(value) as T) : null;
  } catch (err) {
    console.error("Redis GET error:", err);
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  try {
    const client = getRedis();
    if (!client) return;
    const serialized = JSON.stringify(value);

    if (client instanceof UpstashRedis) {
      await client.set(key, serialized, { ex: ttlSeconds });
    } else {
      await (client as Redis).set(key, serialized, "EX", ttlSeconds);
    }
  } catch (err) {
    console.error("Redis SET error:", err);
  }
}

export async function cacheDel(key: string | string[]): Promise<void> {
  try {
    const client = getRedis();
    if (!client) return;
    await client.del(key as any);
  } catch (err) {
    console.error("Redis DEL error:", err);
  }
}
