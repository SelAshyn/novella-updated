import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetOTPEmail } from "@/lib/email";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  // ── Rate limit by IP: 5 attempts per hour ────────────────────────────────
  const ip = getClientIp(req)
  const rl = await rateLimit(`pwd-reset:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.success) return rateLimitResponse(rl.retryAfter)
  let email: string | undefined;

  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  // ── Per-account rate limit: max 3 reset requests per 30 minutes per email
  const emailRl = await rateLimit(`pwd-reset-email:${email}`, 3, 30 * 60 * 1000);
  if (!emailRl.success) return rateLimitResponse(emailRl.retryAfter);

  try {
    // Check if an account with this email exists in our DB.
    // If not, return success anyway (don't reveal whether the account exists).
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Invalidate any previous unused OTPs for this email
      await prisma.passwordResetOTP.updateMany({
        where: { email, used: false },
        data: { used: true },
      });

      const code = generateOTP();
      await prisma.passwordResetOTP.create({
        data: { email, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      });

      const emailSent = await sendPasswordResetOTPEmail({
        to: email,
        userName: user.displayName || "",
        otp: code,
      });

      if (!emailSent) {
        console.error("[send-password-reset-otp] sendPasswordResetOTPEmail returned false for:", email);
        return NextResponse.json(
          { error: "Could not send the reset email. Check GMAIL_USER and GMAIL_APP_PASSWORD." },
          { status: 500 }
        );
      }
    }

    // Always return success — prevents account enumeration
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[send-password-reset-otp] error:", error);
    return NextResponse.json(
      { error: "Failed to send reset email. Please try again later." },
      { status: 500 }
    );
  }
}
