import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { canAddVocabulary, getPlanLimits } from '@/lib/plans';
import { updateStreak } from '@/lib/streak';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`vocab-get:${ip}`, 60, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const cards = await prisma.vocabularyCard.findMany({
      where: { userId: user.id },
      include: { book: { select: { id: true, title: true, author: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Vocabulary GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`vocab-post:${ip}`, 30, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get user stats for plan check
    const userStats = await prisma.userStats.findUnique({
      where: { userId: user.id },
      select: { plan: true },
    });

    // Count current vocabulary cards
    const cardCount = await prisma.vocabularyCard.count({
      where: { userId: user.id },
    });

    const plan = userStats?.plan || 'free';
    const limits = getPlanLimits(plan);

    // Check vocabulary limit
    if (!canAddVocabulary(cardCount, plan)) {
      return NextResponse.json(
        {
          error: 'Vocabulary limit reached',
          message: `You've reached the maximum of ${limits.maxVocabularyWords} words on the ${plan} plan. Upgrade to Plus for unlimited vocabulary.`,
          limit: limits.maxVocabularyWords,
          current: cardCount,
        },
        { status: 403 }
      );
    }

    const { bookId, word, ipa, meaning, example, pageNumber } = await request.json();

    if (!bookId || !word?.trim() || !meaning?.trim() || !example?.trim() || !pageNumber) {
      return NextResponse.json({ error: 'bookId, word, meaning, example and pageNumber are required' }, { status: 400 });
    }

    // Verify book belongs to user
    const book = await prisma.book.findFirst({ where: { id: bookId, userId: user.id } });
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

    const card = await prisma.vocabularyCard.create({
      data: {
        userId: user.id,
        bookId,
        word: word.trim(),
        ipa: ipa?.trim() || null,
        meaning: meaning.trim(),
        example: example.trim(),
        pageNumber: parseInt(pageNumber),
        nextReviewDate: new Date(), // Due immediately
        reviewCount: 0,
        easeFactor: 2.5,
        interval: 1,
      },
      include: { book: { select: { id: true, title: true, author: true } } },
    });

    // Update stats + streak in parallel
    await Promise.all([
      prisma.userStats.update({
        where: { userId: user.id },
        data: { totalWordsLearned: { increment: 1 } },
      }),
      updateStreak(user.id),
    ]);

    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    console.error('Vocabulary POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`vocab-delete:${ip}`, 30, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const card = await prisma.vocabularyCard.findFirst({ where: { id, userId: user.id } });
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

    await prisma.vocabularyCard.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vocabulary DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
