import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`user-stats:${ip}`, 60, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const stats = await prisma.userStats.findUnique({ where: { userId: user.id } });
    if (!stats) return NextResponse.json({ error: "Stats not found" }, { status: 404 });

    return NextResponse.json({
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      streakFreezes: stats.streakFreezes,
      lastReadDate: stats.lastReadDate?.toISOString() ?? null,
      plan: stats.plan,
      totalBooksRead: stats.totalBooksRead,
      totalPagesRead: stats.totalPagesRead,
      totalWordsLearned: stats.totalWordsLearned,
      totalQuotesCollected: stats.totalQuotesCollected,
    });
  } catch (error) {
    console.error("User stats GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
