import { NextRequest, NextResponse } from "next/server";
import { sendOTPEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

/** Generate a 6-digit OTP string. */
function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * POST /api/auth/send-otp
 *
 * Two modes:
 *
 * A) New sign-up (no Firebase account yet):
 *    Body: { email, name, password }
 *    → Stores a PendingSignup record (hashed password) + sends OTP.
 *    → Does NOT create a Firebase or DB user yet.
 *
 * B) Resend for an existing unverified Firebase user:
 *    Header: Authorization: Bearer <idToken>
 *    Body: {} (no email/password needed — reads from token)
 *    → Just regenerates and resends the OTP.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`send-otp:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  let email: string;
  let userName: string = "";
  let isResend = false;

  const authHeader = req.headers.get("Authorization");

  // ── Mode B: resend for an already-created (but unverified) Firebase user ──
  if (authHeader?.startsWith("Bearer ")) {
    const { auth } = await import("@/lib/firebase-admin");
    let decoded: Awaited<ReturnType<typeof auth.verifyIdToken>>;
    try {
      decoded = await auth.verifyIdToken(authHeader.split("Bearer ")[1]);
    } catch {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }
    if (decoded.email_verified) {
      return NextResponse.json({ error: "Email already verified." }, { status: 400 });
    }
    email = decoded.email!;
    userName = decoded.name || "";
    isResend = true;
  } else {
    // ── Mode A: brand-new sign-up ─────────────────────────────────────────
    let body: { email?: string; name?: string; password?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { email: rawEmail, name, password } = body;

    if (!rawEmail || !name?.trim() || !password) {
      return NextResponse.json({ error: "email, name and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    email = rawEmail.toLowerCase().trim();
    userName = name.trim();

    // Block if email already has a verified account in DB
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in instead." },
        { status: 409 }
      );
    }

    // Hash password and upsert pending signup (30-min expiry)
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.pendingSignup.upsert({
      where: { email },
      create: {
        email,
        name: userName,
        passwordHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
      update: {
        name: userName,
        passwordHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
  }

  // ── Per-email rate limit ──────────────────────────────────────────────────
  const emailRl = await rateLimit(`send-otp-email:${email}`, 5, 15 * 60 * 1000);
  if (!emailRl.success) return rateLimitResponse(emailRl.retryAfter);

  // ── Generate OTP, invalidate old ones, save new one ──────────────────────
  try {
    await prisma.emailVerificationOTP.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    const code = generateOTP();
    await prisma.emailVerificationOTP.create({
      data: { email, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    const emailSent = await sendOTPEmail({ to: email, userName, otp: code });
    if (!emailSent) {
      return NextResponse.json(
        { error: "Could not send the verification email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "OTP sent" });
  } catch (error: any) {
    console.error("[send-otp] error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again later." },
      { status: 500 }
    );
  }
}
