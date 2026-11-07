import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`book-quotes:${ip}`, 120, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const book = await prisma.book.findFirst({ where: { id, userId: user.id } });
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

    const quotes = await prisma.quote.findMany({
      where: { bookId: id, userId: user.id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ quotes });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
