import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/firebase-admin";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`class-members-get:${ip}`, 60, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifyIdToken(authHeader.substring(7));
    const user = await prisma.user.findUnique({ where: { firebaseUid: decodedToken.uid } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { classId } = await params;

    // Only teachers can view members
    const membership = await prisma.classMember.findUnique({
      where: { classId_userId: { classId, userId: user.id } },
    });
    if (!membership || membership.role !== "teacher") {
      return NextResponse.json({ error: "Only teachers can view members" }, { status: 403 });
    }

    const members = await prisma.classMember.findMany({
      where: { classId },
      include: { user: { select: { id: true, email: true, displayName: true } } },
      orderBy: { joinedAt: "asc" },
    });

    // Real progress: total pages read + reviewed in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const memberData = await Promise.all(
      members.map(async (m) => {
        const [sessions, recentReviews] = await Promise.all([
          prisma.readingSession.aggregate({
            where: { userId: m.userId },
            _sum: { pagesRead: true },
          }),
          prisma.vocabularyCard.count({
            where: {
              userId: m.userId,
              updatedAt: { gte: sevenDaysAgo },
              reviewCount: { gt: 0 },
            },
          }),
        ]);

        return {
          id: m.userId,
          name: m.user.displayName || m.user.email.split("@")[0],
          email: m.user.email,
          role: m.role,
          pagesRead: sessions._sum.pagesRead ?? 0,
          reviewedThisWeek: recentReviews > 0,
          joinedAt: m.joinedAt.toISOString(),
        };
      })
    );

    return NextResponse.json(memberData);
  } catch (error) {
    console.error("[members GET]", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

// DELETE — teacher removes a member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`class-members-del:${ip}`, 30, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifyIdToken(authHeader.substring(7));
    const user = await prisma.user.findUnique({ where: { firebaseUid: decodedToken.uid } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { classId } = await params;
    const membership = await prisma.classMember.findUnique({
      where: { classId_userId: { classId, userId: user.id } },
    });
    if (!membership || membership.role !== "teacher") {
      return NextResponse.json({ error: "Only teachers can remove members" }, { status: 403 });
    }

    const { memberId } = await request.json();
    if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });
    // Cannot remove the teacher themselves
    if (memberId === user.id) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    await prisma.classMember.delete({
      where: { classId_userId: { classId, userId: memberId } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[members DELETE]", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
