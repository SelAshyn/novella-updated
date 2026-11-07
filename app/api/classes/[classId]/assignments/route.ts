import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`class-assign:${ip}`, 20, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { classId } = await params;
    const membership = await prisma.classMember.findUnique({
      where: { classId_userId: { classId, userId: user.id } },
    });
    if (!membership || membership.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can assign books' }, { status: 403 });
    }

    const { title, author, coverUrl, chapters, dueDate } = await request.json();
    if (!title?.trim() || !author?.trim()) {
      return NextResponse.json({ error: 'title and author are required' }, { status: 400 });
    }

    const assignment = await prisma.classBook.create({
      data: {
        classId,
        title: title.trim(),
        author: author.trim(),
        coverUrl: coverUrl || null,
        chapters: chapters?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error('[assignments POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`class-unassign:${ip}`, 20, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { classId } = await params;
    const membership = await prisma.classMember.findUnique({
      where: { classId_userId: { classId, userId: user.id } },
    });
    if (!membership || membership.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can remove assignments' }, { status: 403 });
    }

    const { assignmentId } = await request.json();
    await prisma.classBook.delete({ where: { id: assignmentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[assignments DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
