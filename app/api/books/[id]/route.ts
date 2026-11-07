import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`book-id:${ip}`, 120, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const book = await prisma.book.findFirst({
      where: { id, userId: user.id },
      include: { _count: { select: { vocabularyCards: true, quotes: true } } },
    });
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    return NextResponse.json({ book });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`book-patch:${ip}`, 60, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const book = await prisma.book.findFirst({ where: { id, userId: user.id } });
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

    const body = await request.json();
    const updated = await prisma.book.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.author !== undefined && { author: body.author }),
        ...(body.currentPage !== undefined && { currentPage: parseInt(body.currentPage) }),
        ...(body.totalPages !== undefined && { totalPages: parseInt(body.totalPages) }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
        ...(body.coverImageUrl !== undefined && { coverImageUrl: body.coverImageUrl }),
      },
    });

    if (body.status === 'FINISHED' && book.status !== 'FINISHED') {
      await prisma.userStats.update({
        where: { userId: user.id },
        data: { totalBooksRead: { increment: 1 } },
      });
    }
    return NextResponse.json({ book: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`book-delete:${ip}`, 20, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const book = await prisma.book.findFirst({ where: { id, userId: user.id } });
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

    await prisma.book.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
