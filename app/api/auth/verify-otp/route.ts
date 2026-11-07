import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`verify-otp:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  // ── Parse body ────────────────────────────────────────────────────────────
  let email: string | undefined;
  let code: string | undefined;

  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : undefined;
    code  = typeof body?.code  === "string" ? body.code.trim()                : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!email || !code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "email and a valid 6-digit code are required." }, { status: 400 });
  }

  // ── Per-email rate limit ──────────────────────────────────────────────────
  const emailRl = await rateLimit(`verify-otp-email:${email}`, 5, 10 * 60 * 1000);
  if (!emailRl.success) return rateLimitResponse(emailRl.retryAfter);

  try {
    // ── 1. Look up the OTP record ─────────────────────────────────────────
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

    if (record.attempts >= 5) {
      await prisma.emailVerificationOTP.update({
        where: { id: record.id },
        data: { used: true },
      });
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new code." },
        { status: 429 }
      );
    }

    if (record.code !== code) {
      const newAttempts = record.attempts + 1;
      const isLocked = newAttempts >= 5;
      await prisma.emailVerificationOTP.update({
        where: { id: record.id },
        data: { attempts: newAttempts, used: isLocked },
      });
      const remaining = Math.max(0, 5 - newAttempts);
      return NextResponse.json(
        {
          error: isLocked
            ? "Too many failed attempts. Please request a new code."
            : `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
        },
        { status: 400 }
      );
    }

    // ── 2. OTP is correct — mark it used ─────────────────────────────────
    await prisma.emailVerificationOTP.update({
      where: { id: record.id },
      data: { used: true },
    });

    // ── 3. Retrieve the pending signup data ───────────────────────────────
    const pending = await prisma.pendingSignup.findUnique({ where: { email } });
    if (!pending || new Date() > pending.expiresAt) {
      return NextResponse.json(
        { error: "Sign-up session expired. Please start over." },
        { status: 400 }
      );
    }

    // ── 4. Create the Firebase account (now that OTP is verified) ─────────
    const { auth } = await import("@/lib/firebase-admin");

    let uid: string;
    try {
      // Check if a Firebase user already exists (e.g. interrupted flow)
      const existingFbUser = await auth.getUserByEmail(email).catch(() => null);
      if (existingFbUser) {
        // Update to verified and set the display name
        await auth.updateUser(existingFbUser.uid, {
          displayName: pending.name,
          emailVerified: true,
        });
        uid = existingFbUser.uid;
      } else {
        const fbUser = await auth.createUser({
          email,
          password: pending.passwordHash, // NOTE: this is the hash — see below
          displayName: pending.name,
          emailVerified: true,
        });
        uid = fbUser.uid;
      }
    } catch (fbErr: any) {
      // Firebase doesn't accept bcrypt hashes as passwords — we need to import
      // using a different approach. Create the user without password and use
      // Firebase's custom token to sign them in client-side, then let the
      // client call updatePassword.
      console.error("[verify-otp] Firebase createUser error:", fbErr);

      // Fallback: create without password, client will set it via updatePassword
      const fbUser = await auth.createUser({
        email,
        displayName: pending.name,
        emailVerified: true,
      });
      uid = fbUser.uid;
    }

    // ── 5. Create the DB user record ──────────────────────────────────────
    const existingDbUser = await prisma.user.findUnique({ where: { email } });
    if (!existingDbUser) {
      await prisma.user.create({
        data: {
          firebaseUid: uid,
          email,
          displayName: pending.name,
          stats: {
            create: {
              currentStreak: 0,
              longestStreak: 0,
              totalBooksRead: 0,
              totalPagesRead: 0,
              totalWordsLearned: 0,
              totalQuotesCollected: 0,
              streakFreezes: 1,
            },
          },
        },
      });
    }

    // ── 6. Clean up pending signup ────────────────────────────────────────
    await prisma.pendingSignup.delete({ where: { email } }).catch(() => {});

    // ── 7. Create a custom token so the client can sign in ────────────────
    const customToken = await auth.createCustomToken(uid);

    return NextResponse.json({ success: true, customToken, displayName: pending.name });
  } catch (error) {
    console.error("[verify-otp] error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
