import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { sendReportNotificationEmail } from "@/lib/email";

// Where report/feedback notifications are delivered.
const REPORT_NOTIFY_EMAIL = process.env.REPORT_NOTIFY_EMAIL ?? "novella.admin@gmail.com";

const VALID_TYPES = ["glitch", "feedback", "feature", "other"] as const;
type ReportType = (typeof VALID_TYPES)[number];

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`reports-get:${ip}`, 60, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reports = await prisma.report.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Reports GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`reports-post:${ip}`, 20, 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { type, title, description, area, severity, deviceInfo } = body as {
      type?: string;
      title?: string;
      description?: string;
      area?: string;
      severity?: string;
      deviceInfo?: string;
    };

    if (!type || !VALID_TYPES.includes(type as ReportType)) {
      return NextResponse.json(
        { error: "Invalid report type. Must be 'glitch', 'feedback', 'feature', or 'other'." },
        { status: 400 }
      );
    }

    const trimmedTitle = (title ?? "").trim();
    if (!trimmedTitle || trimmedTitle.length < 3) {
      return NextResponse.json(
        { error: "Title must be at least 3 characters." },
        { status: 400 }
      );
    }
    if (trimmedTitle.length > 200) {
      return NextResponse.json(
        { error: "Title must not exceed 200 characters." },
        { status: 400 }
      );
    }

    const trimmedDesc = (description ?? "").trim();
    if (!trimmedDesc || trimmedDesc.length < 5) {
      return NextResponse.json(
        { error: "Description must be at least 5 characters." },
        { status: 400 }
      );
    }
    if (trimmedDesc.length > 5000) {
      return NextResponse.json(
        { error: "Description must not exceed 5000 characters." },
        { status: 400 }
      );
    }

    const validSeverities = ["low", "medium", "high", "critical"];
    const sanitizedSeverity = severity && validSeverities.includes(severity) ? severity : null;

    const report = await prisma.report.create({
      data: {
        userId: user.id,
        type,
        title: trimmedTitle,
        description: trimmedDesc,
        area: typeof area === "string" && area.trim() ? area.trim().slice(0, 50) : null,
        severity: sanitizedSeverity,
        deviceInfo: typeof deviceInfo === "string" ? deviceInfo.slice(0, 1000) : null,
        status: "OPEN",
      },
    });

    // ── Notify the admin inbox ────────────────────────────────────────────
    // Fire-and-forget: a failure here must never break the user's submission.
    try {
      await sendReportNotificationEmail({
        to: REPORT_NOTIFY_EMAIL,
        reportType: type,
        title: trimmedTitle,
        description: trimmedDesc,
        area: typeof area === "string" && area.trim() ? area.trim().slice(0, 50) : null,
        severity: sanitizedSeverity,
        deviceInfo: typeof deviceInfo === "string" ? deviceInfo.slice(0, 1000) : null,
        submittedBy: {
          name: user.displayName || user.email.split("@")[0],
          email: user.email,
        },
        createdAt: report.createdAt,
      });
    } catch (emailError) {
      console.error("[reports] notification email failed:", emailError);
    }

    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (error) {
    console.error("Reports POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

