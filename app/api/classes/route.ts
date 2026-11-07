import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/firebase-admin"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`classes-get:${ip}`, 60, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decodedToken = await auth.verifyIdToken(token)
    const firebaseUid = decodedToken.uid

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get classes where user is a member
    const classMembers = await prisma.classMember.findMany({
      where: { userId: user.id },
      include: {
        class: {
          include: {
            assignments: true,
            _count: {
              select: { members: true },
            },
          },
        },
      },
    })

    const classes = classMembers.map((cm) => ({
      id: cm.class.id,
      name: cm.class.name,
      subject: cm.class.subject,
      joinCode: cm.class.joinCode,
      memberCount: cm.class._count.members,
      role: cm.role,
      assignments: cm.class.assignments.map((a) => ({
        id: a.id,
        title: a.title,
        author: a.author,
        chapters: a.chapters,
        dueDate: a.dueDate?.toISOString() || null,
        wordListId: a.wordListId,
      })),
    }))

    return NextResponse.json(classes)
  } catch (error) {
    console.error("Error fetching classes:", error)
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`classes-post:${ip}`, 20, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decodedToken = await auth.verifyIdToken(token)
    const firebaseUid = decodedToken.uid

    const body = await request.json()
    const { name, subject } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Class name is required" },
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

    // Generate 6-character join code (letters and numbers, no lookalikes)
    const generateJoinCode = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // No 0, O, 1, I
      let code = ""
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return code
    }

    let joinCode = generateJoinCode()

    // Ensure unique code
    let existing = await prisma.class.findUnique({ where: { joinCode } })
    while (existing) {
      joinCode = generateJoinCode()
      existing = await prisma.class.findUnique({ where: { joinCode } })
    }

    // Create class
    const newClass = await prisma.class.create({
      data: {
        name: name.trim(),
        subject: subject?.trim() || null,
        teacherId: user.id,
        joinCode,
      },
    })

    // Add creator as teacher
    await prisma.classMember.create({
      data: {
        classId: newClass.id,
        userId: user.id,
        role: "teacher",
      },
    })

    return NextResponse.json({
      id: newClass.id,
      name: newClass.name,
      subject: newClass.subject,
      joinCode: newClass.joinCode,
      memberCount: 1,
      role: "teacher",
      assignments: [],
    })
  } catch (error) {
    console.error("Error creating class:", error)
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    )
  }
}
