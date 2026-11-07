import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { canAddBook, getPlanLimits } from '@/lib/plans';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`books-get:${ip}`, 60, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const books = await prisma.book.findMany({
      where: { userId: user.id },
      include: { _count: { select: { vocabularyCards: true, quotes: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ books });
  } catch (error) {
    console.error('Books GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`books-post:${ip}`, 30, 60 * 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userStats = await prisma.userStats.findUnique({
      where: { userId: user.id },
      select: { plan: true },
    });
    const bookCount = await prisma.book.count({ where: { userId: user.id } });
    const plan = userStats?.plan || 'free';
    const limits = getPlanLimits(plan);

    if (!canAddBook(bookCount, plan)) {
      return NextResponse.json(
        {
          error: 'Book limit reached',
          message: `You've reached the maximum of ${limits.maxBooks} books on the ${plan} plan.`,
          limit: limits.maxBooks,
          current: bookCount,
        },
        { status: 403 }
      );
    }

    const { title, author, totalPages, dueDate, coverImageUrl, status = 'READING' } = await request.json();
    if (!title?.trim() || !author?.trim() || !totalPages) {
      return NextResponse.json({ error: 'title, author and totalPages are required' }, { status: 400 });
    }

    const book = await prisma.book.create({
      data: {
        userId: user.id,
        title: title.trim(),
        author: author.trim(),
        totalPages: parseInt(totalPages),
        currentPage: 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        coverImageUrl: coverImageUrl ?? null,
        status,
      },
    });
    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    console.error('Books POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
