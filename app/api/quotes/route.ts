import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`quotes-post:${ip}`, 60, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookId, text, pageNumber } = await request.json();
    if (!bookId || !text?.trim() || !pageNumber) {
      return NextResponse.json({ error: 'bookId, text and pageNumber are required' }, { status: 400 });
    }

    const book = await prisma.book.findFirst({ where: { id: bookId, userId: user.id } });
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

    const quote = await prisma.quote.create({
      data: { userId: user.id, bookId, text: text.trim(), pageNumber: parseInt(pageNumber) },
    });
    await prisma.userStats.update({
      where: { userId: user.id },
      data: { totalQuotesCollected: { increment: 1 } },
    });
    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`quotes-delete:${ip}`, 30, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const quote = await prisma.quote.findFirst({ where: { id, userId: user.id } });
    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

    await prisma.quote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
