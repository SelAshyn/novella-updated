import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { getPlanLimits } from '@/lib/plans';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`user-plan:${ip}`, 60, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userStats = await prisma.userStats.findUnique({
      where: { userId: user.id },
      select: { plan: true },
    });
    const plan = userStats?.plan || 'free';
    const limits = getPlanLimits(plan);

    const [bookCount, vocabularyCount] = await Promise.all([
      prisma.book.count({ where: { userId: user.id } }),
      prisma.vocabularyCard.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({ plan, limits, usage: { books: bookCount, vocabulary: vocabularyCount } });
  } catch (error) {
    console.error('User plan GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
