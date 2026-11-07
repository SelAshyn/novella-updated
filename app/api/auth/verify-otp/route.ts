import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // ── Rate limit: 10 attempts per 10 minutes per IP (OTP brute-force protection)
  const ip = getClientIp(req);
  const rl = await rateLimit(`verify-otp:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  // ── 1. Auth header ────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Verify Firebase ID token ───────────────────────────────────────────
  let decodedToken: Awaited<ReturnType<typeof auth.verifyIdToken>>;
  try {
    decodedToken = await auth.verifyIdToken(authHeader.split("Bearer ")[1]);
  } catch (error) {
    console.error("[verify-otp] verifyIdToken failed:", error);
    return NextResponse.json(
      { error: "Invalid or expired session. Please sign in again." },
      { status: 401 }
    );
  }

  if (decodedToken.email_verified) {
    return NextResponse.json({ success: true, message: "Already verified" });
  }

  const email = decodedToken.email!;
  const uid = decodedToken.uid;

  // ── Per-account rate limit: 5 verify attempts per 10 minutes per email
  const emailRl = await rateLimit(`verify-otp-email:${email.toLowerCase()}`, 5, 10 * 60 * 1000);
  if (!emailRl.success) return rateLimitResponse(emailRl.retryAfter);

  // ── 3. Read and validate OTP from body ────────────────────────────────────
  let code: string | undefined;
  try {
    const body = await req.json();
    code = typeof body?.code === "string" ? body.code.trim() : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter a valid 6-digit code." }, { status: 400 });
  }

  // ── 4. Look up OTP record ─────────────────────────────────────────────────
  try {
    const record = await prisma.emailVerificationOTP.findFirst({
      where: { email, used: false },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    if (new Date() > record.expiresAt) {
      return NextResponse.json(
        { error: "Your code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if maximum attempts (5) have been exceeded
    if (record.attempts >= 5) {
      await prisma.emailVerificationOTP.update({
        where: { id: record.id },
        data: { used: true },
      });
      return NextResponse.json(
        { error: "Too many failed attempts. This code has been invalidated. Please request a new one." },
        { status: 429 }
      );
    }

    if (record.code !== code) {
      const newAttempts = record.attempts + 1;
      const isLocked = newAttempts >= 5;

      await prisma.emailVerificationOTP.update({
        where: { id: record.id },
        data: {
          attempts: newAttempts,
          used: isLocked,
        },
      });

      const remaining = Math.max(0, 5 - newAttempts);
      return NextResponse.json(
        {
          error: isLocked
            ? "Too many failed attempts. This code has been invalidated. Please request a new one."
            : `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
        },
        { status: 400 }
      );
    }

    // ── 5. Mark OTP used and verify the Firebase user ─────────────────────
    await prisma.emailVerificationOTP.update({
      where: { id: record.id },
      data: { used: true },
    });

    await auth.updateUser(uid, { emailVerified: true });

    return NextResponse.json({ success: true, message: "Email verified" });
  } catch (error) {
    console.error("[verify-otp] error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
