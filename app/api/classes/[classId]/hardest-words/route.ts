import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/firebase-admin";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`class-hardest:${ip}`, 60, 60 * 1000);
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
    if (!membership) {
      return NextResponse.json({ error: "Not a member of this class" }, { status: 403 });
    }

    const classMembers = await prisma.classMember.findMany({
      where: { classId },
      select: { userId: true },
    });
    const memberIds = classMembers.map((cm) => cm.userId);
    if (memberIds.length === 0) return NextResponse.json([]);

    const vocabularyCards = await prisma.vocabularyCard.findMany({
      where: { userId: { in: memberIds } },
      select: { word: true, reviewCount: true },
    });

    const wordStats = new Map<string, { totalCards: number; totalReviews: number }>();
    for (const card of vocabularyCards) {
      const s = wordStats.get(card.word) ?? { totalCards: 0, totalReviews: 0 };
      s.totalCards++;
      s.totalReviews += card.reviewCount;
      wordStats.set(card.word, s);
    }

    const hardestWords = Array.from(wordStats.entries())
      .filter(([, s]) => s.totalCards >= 2)
      .map(([word, s]) => {
        const avgReviews = s.totalReviews / s.totalCards;
        const missedPercentage = Math.min(
          100,
          Math.max(0, Math.round(((3 - avgReviews) / 3) * 100))
        );
        return { word, missedPercentage };
      })
      .sort((a, b) => b.missedPercentage - a.missedPercentage)
      .slice(0, 10);

    return NextResponse.json(hardestWords);
  } catch (error) {
    console.error("[hardest-words GET]", error);
    return NextResponse.json({ error: "Failed to fetch hardest words" }, { status: 500 });
  }
}
