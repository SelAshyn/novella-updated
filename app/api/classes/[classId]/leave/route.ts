import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/firebase-admin";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`class-leave:${ip}`, 10, 60 * 1000);
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
      return NextResponse.json({ error: "Not a member of this class" }, { status: 400 });
    }
    if (membership.role === "teacher") {
      return NextResponse.json(
        { error: "Teachers cannot leave their own class. Delete it instead." },
        { status: 400 }
      );
    }

    await prisma.classMember.delete({
      where: { classId_userId: { classId, userId: user.id } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[leave POST]", error);
    return NextResponse.json({ error: "Failed to leave class" }, { status: 500 });
  }
}
