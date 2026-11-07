import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`dashboard:${ip}`, 60, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayCards, currentlyReading, recentQuotes, weekSessions] = await Promise.all([
      prisma.vocabularyCard.findMany({
        where: { userId: user.id, nextReviewDate: { gte: today, lt: tomorrow } },
        include: { book: { select: { title: true, author: true } } },
        orderBy: { nextReviewDate: 'asc' },
        take: 20,
      }),
      prisma.book.findMany({
        where: { userId: user.id, status: 'READING' },
        include: { _count: { select: { vocabularyCards: true, quotes: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 4,
      }),
      prisma.quote.findMany({
        where: { userId: user.id },
        include: { book: { select: { title: true, author: true } } },
        orderBy: { createdAt: 'desc' },
        take: 2,
      }),
      prisma.readingSession.findMany({
        where: { userId: user.id, date: { gte: new Date(Date.now() - 7 * 86_400_000) } },
        orderBy: { date: 'asc' },
      }),
    ]);

    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const weekActivity = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const pages = weekSessions
        .filter((s) => s.date >= d && s.date < next)
        .reduce((sum, s) => sum + s.pagesRead, 0);
      return { day: days[d.getDay()], count: pages };
    });

    return NextResponse.json({
      userName: user.displayName || "",
      stats: user.stats || {
        currentStreak: 0, longestStreak: 0, totalBooksRead: 0,
        totalPagesRead: 0, totalWordsLearned: 0, totalQuotesCollected: 0, streakFreezes: 1,
      },
      todayCards,
      currentlyReading,
      recentQuotes,
      weekActivity,
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
