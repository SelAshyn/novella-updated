import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

/**
 * Use the Neon HTTP/WebSocket driver instead of a TCP connection.
 *
 * Benefits on Vercel serverless:
 * - No cold-start penalty from TCP handshake or connection pool warm-up
 * - Works correctly in short-lived serverless functions
 * - Bypasses PgBouncer entirely — no channel_binding issues
 *
 * We cache on globalThis in development so Next.js hot-reload
 * doesn't create a new instance on every file change.
 */

function createPrismaClient() {
  // Prefer the unpooled direct URL — the Neon driver manages its own pooling
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!

  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool)

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
