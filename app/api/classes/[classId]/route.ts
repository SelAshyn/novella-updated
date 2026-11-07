import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/firebase-admin';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

async function resolveUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const decoded = await auth.verifyIdToken(authHeader.substring(7));
    return prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });
  } catch { return null; }
}

// GET — full class detail
export async function GET(request: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`class-id-get:${ip}`, 60, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { classId } = await params;
    const membership = await prisma.classMember.findUnique({
      where: { classId_userId: { classId, userId: user.id } },
    });
    if (!membership) return NextResponse.json({ error: 'Not a member of this class' }, { status: 403 });

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: { select: { id: true, displayName: true, email: true } },
        members: {
          include: { user: { select: { id: true, displayName: true, email: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        assignments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!classData) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    return NextResponse.json({ class: classData, role: membership.role });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH — update class name/subject (teacher only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`class-id-patch:${ip}`, 30, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { classId } = await params;
    const membership = await prisma.classMember.findUnique({
      where: { classId_userId: { classId, userId: user.id } },
    });
    if (!membership || membership.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can update class settings' }, { status: 403 });
    }

    const body = await request.json();
    const { name, subject, regenerateCode } = body;

    const updateData: Record<string, any> = {};
    if (name?.trim()) updateData.name = name.trim();
    if (typeof subject === 'string') updateData.subject = subject.trim() || null;

    if (regenerateCode) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let newCode = '';
      for (let i = 0; i < 6; i++) newCode += chars[Math.floor(Math.random() * chars.length)];
      // Ensure unique
      let existing = await prisma.class.findUnique({ where: { joinCode: newCode } });
      while (existing) {
        newCode = '';
        for (let i = 0; i < 6; i++) newCode += chars[Math.floor(Math.random() * chars.length)];
        existing = await prisma.class.findUnique({ where: { joinCode: newCode } });
      }
      updateData.joinCode = newCode;
    }

    const updated = await prisma.class.update({ where: { id: classId }, data: updateData });
    return NextResponse.json({ class: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — teacher deletes class
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`class-id-del:${ip}`, 20, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { classId } = await params;
    const membership = await prisma.classMember.findUnique({
      where: { classId_userId: { classId, userId: user.id } },
    });
    if (!membership || membership.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can delete a class' }, { status: 403 });
    }

    await prisma.class.delete({ where: { id: classId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
