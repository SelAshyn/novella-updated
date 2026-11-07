import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase-admin";
import { sendOTPEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

/** Generate a 6-digit OTP string. */
function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  // ── Rate limit by IP: 10 OTP sends per 15 minutes ────────────────────────
  const ip = getClientIp(req)
  const rl = await rateLimit(`send-otp:${ip}`, 10, 15 * 60 * 1000)
  if (!rl.success) return rateLimitResponse(rl.retryAfter)

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
    console.error("[send-otp] verifyIdToken failed:", error);
    return NextResponse.json(
      { error: "Invalid or expired session. Please sign in again." },
      { status: 401 }
    );
  }

  if (decodedToken.email_verified) {
    return NextResponse.json({ error: "Email already verified" }, { status: 400 });
  }

  const email = decodedToken.email!;

  // ── Per-account rate limit: max 5 sends per 15 minutes per email ───────────
  const emailRl = await rateLimit(`send-otp-email:${email.toLowerCase()}`, 5, 15 * 60 * 1000);
  if (!emailRl.success) return rateLimitResponse(emailRl.retryAfter);

  // ── 3. Invalidate old OTPs and create a new one ───────────────────────────
  try {
    await prisma.emailVerificationOTP.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    const code = generateOTP();
    await prisma.emailVerificationOTP.create({
      data: { email, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    // ── 4. Send the email ──────────────────────────────────────────────────
    const emailSent = await sendOTPEmail({
      to: email,
      userName: decodedToken.name || "",
      otp: code,
    });

    if (!emailSent) {
      console.error("[send-otp] sendOTPEmail returned false for:", email);
      return NextResponse.json(
        { error: "Could not send the verification email. Check your GMAIL_USER and GMAIL_APP_PASSWORD settings." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "OTP sent" });
  } catch (error: any) {
    console.error("[send-otp] error:", error);

    if (error?.code === "auth/too-many-requests") {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send verification email. Please try again later." },
      { status: 500 }
    );
  }
}
