import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/firebase-admin"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipRl = await rateLimit(`class-join-ip:${ip}`, 15, 60 * 1000);
  if (!ipRl.success) return rateLimitResponse(ipRl.retryAfter);

  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decodedToken = await auth.verifyIdToken(token)
    const firebaseUid = decodedToken.uid

    // Rate limit per user account: 10 join attempts per minute
    const userRl = await rateLimit(`class-join-user:${firebaseUid}`, 10, 60 * 1000);
    if (!userRl.success) return rateLimitResponse(userRl.retryAfter);

    const body = await request.json()
    const { joinCode } = body

    if (!joinCode) {
      return NextResponse.json(
        { error: "Join code is required" },
        { status: 400 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find class by join code
    const classToJoin = await prisma.class.findUnique({
      where: { joinCode },
    })

    if (!classToJoin) {
      return NextResponse.json(
        { error: "Invalid join code" },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.classMember.findUnique({
      where: {
        classId_userId: {
          classId: classToJoin.id,
          userId: user.id,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this class" },
        { status: 400 }
      )
    }

    await prisma.classMember.create({
      data: {
        classId: classToJoin.id,
        userId: user.id,
        role: "student",
      },
    })

    return NextResponse.json({ success: true, classId: classToJoin.id })
  } catch (error) {
    console.error("Error joining class:", error)
    return NextResponse.json(
      { error: "Failed to join class" },
      { status: 500 }
    )
  }
}
