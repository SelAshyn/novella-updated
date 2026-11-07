import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase-admin";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

/**
 * Send custom verification email
 * This uses our custom email template instead of Firebase's default
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const ipRl = await rateLimit(`send-verif-ip:${ip}`, 5, 15 * 60 * 1000);
  if (!ipRl.success) return rateLimitResponse(ipRl.retryAfter);

  try {
    // 1. Verify Firebase auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);

    // Rate limit per email
    const email = decodedToken.email!;
    const emailRl = await rateLimit(`send-verif-email:${email.toLowerCase()}`, 3, 15 * 60 * 1000);
    if (!emailRl.success) return rateLimitResponse(emailRl.retryAfter);
    
    // 2. Check if already verified
    if (decodedToken.email_verified) {
      return NextResponse.json(
        { error: "Email already verified" },
        { status: 400 }
      );
    }

    // 3. Generate custom verification link
    // We'll use Firebase's generateEmailVerificationLink for the action code
    const verificationLink = await auth.generateEmailVerificationLink(
      decodedToken.email!,
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/action`,
      }
    );

    // 4. Send custom email
    const emailSent = await sendVerificationEmail({
      to: decodedToken.email!,
      userName: decodedToken.name || "",
      verificationUrl: verificationLink,
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent",
    });
  } catch (error: any) {
    console.error("Send verification email error:", error);
    
    if (error.code === "auth/too-many-requests") {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
