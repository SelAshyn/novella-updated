import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { updateStreak } from '@/lib/streak';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`vocab-review:${ip}`, 60, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const card = await prisma.vocabularyCard.findFirst({ where: { id, userId: user.id } });
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const rawInterval = body?.interval;
    const safeInterval =
      typeof rawInterval === 'number' && Number.isInteger(rawInterval) && rawInterval >= 1 && rawInterval <= 365
        ? rawInterval
        : 1;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + safeInterval);

    const [updated, streak] = await Promise.all([
      prisma.vocabularyCard.update({
        where: { id },
        data: {
          nextReviewDate,
          reviewCount: { increment: 1 },
          interval: safeInterval,
        },
      }),
      updateStreak(user.id),
    ]);

    return NextResponse.json({ card: updated, streak });
  } catch (error) {
    console.error('[review PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
