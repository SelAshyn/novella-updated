import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`vocab-due:${ip}`, 60, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const cards = await prisma.vocabularyCard.findMany({
      where: { userId: user.id, nextReviewDate: { lte: new Date() } },
      include: { book: { select: { title: true } } },
      orderBy: { nextReviewDate: 'asc' },
    });
    return NextResponse.json({ cards });
  } catch (error) {
    console.error('[vocab-due]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
