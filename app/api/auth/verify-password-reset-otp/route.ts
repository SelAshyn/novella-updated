import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // 10 attempts per 10 minutes — prevents brute-force of the 6-digit code
  const ip = getClientIp(req);
  const rl = await rateLimit(`verify-pwd-otp:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);
  let email: string | undefined;
  let code: string | undefined;
  let newPassword: string | undefined;
  let validateOnly = false;

  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : undefined;
    code =
      typeof body?.code === "string"
        ? body.code.trim()
        : typeof body?.otp === "string"
        ? body.otp.trim()
        : undefined;
    newPassword = typeof body?.newPassword === "string" ? body.newPassword : undefined;
    validateOnly = Boolean(body?.validateOnly);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!email || !code || (!validateOnly && !newPassword)) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter a valid 6-digit code.", field: "otp" }, { status: 400 });
  }

  if (!validateOnly && newPassword && newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  // ── Per-account rate limit: 5 attempts per 10 minutes per email
  const emailRl = await rateLimit(`verify-pwd-otp-email:${email}`, 5, 10 * 60 * 1000);
  if (!emailRl.success) return rateLimitResponse(emailRl.retryAfter);

  try {
    // Look up the most recent valid OTP
    const record = await prisma.passwordResetOTP.findFirst({
      where: { email, used: false },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json(
        { error: "No reset code found. Please request a new one.", field: "otp" },
        { status: 400 }
      );
    }

    if (new Date() > record.expiresAt) {
      return NextResponse.json(
        { error: "Your code has expired. Please request a new one.", field: "otp" },
        { status: 400 }
      );
    }

    // Check if maximum attempts (5) have been reached
    if (record.attempts >= 5) {
      await prisma.passwordResetOTP.update({
        where: { id: record.id },
        data: { used: true },
      });
      return NextResponse.json(
        { error: "Too many failed attempts. This code has been invalidated. Please request a new one.", field: "otp" },
        { status: 429 }
      );
    }

    if (record.code !== code) {
      const newAttempts = record.attempts + 1;
      const isLocked = newAttempts >= 5;

      await prisma.passwordResetOTP.update({
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
          field: "otp",
        },
        { status: 400 }
      );
    }

    // If client is only checking if the code is correct before form submission
    if (validateOnly) {
      return NextResponse.json({ valid: true, success: true });
    }

    // Look up the Firebase user by email
    const firebaseUser = await auth.getUserByEmail(email);

    // ── Reject if the new password is the same as the current one ─────────
    // We test this by attempting a sign-in with the proposed new password via
    // the Firebase REST API. If it succeeds, the passwords are identical.
    if (newPassword) {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      if (apiKey) {
        try {
          const signInRes = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                password: newPassword,
                returnSecureToken: false,
              }),
            }
          );
          if (signInRes.ok) {
            // Sign-in with the new password succeeded → it matches the current password
            return NextResponse.json(
              { error: "New password must be different from your current password." },
              { status: 400 }
            );
          }
        } catch {
          // Network error probing Firebase — proceed with the reset rather than blocking
        }
      }
    }

    // Mark OTP as used BEFORE updating password (so a retry on network error doesn't reuse it)
    await prisma.passwordResetOTP.update({
      where: { id: record.id },
      data: { used: true },
    });

    // Update the password via Firebase Admin
    await auth.updateUser(firebaseUser.uid, { password: newPassword });

    return NextResponse.json({ success: true, message: "Password updated." });
  } catch (error: any) {
    console.error("[verify-password-reset-otp] error:", error);

    if (error?.code === "auth/user-not-found") {
      // Don't reveal the account doesn't exist
      return NextResponse.json(
        { error: "Incorrect code. Please try again." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to reset password. Please try again later." },
      { status: 500 }
    );
  }
}
