import { NextRequest } from "next/server";
import { auth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

/**
 * Verify the Firebase ID token from the Authorization header and return
 * the corresponding DB user. Returns null if the token is missing, invalid,
 * or the user cannot be resolved.
 *
 * This is the ONLY correct way to authenticate a request. Never trust
 * x-firebase-uid or x-firebase-email headers alone — they are client-supplied
 * and forgeable.
 */
export async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ??
                     request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const decoded = await auth.verifyIdToken(authHeader.substring(7));

    // Look up or create the user scoped to the verified UID only
    const existing = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      include: { stats: true },
    });
    if (existing) return existing;

    // First login — provision the account
    return prisma.user.create({
      data: {
        firebaseUid: decoded.uid,
        email: decoded.email ?? "",
        displayName: decoded.name ?? null,
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
      include: { stats: true },
    });
  } catch {
    return null;
  }
}

// ── Legacy helpers (kept for compatibility) ────────────────────────────────

export async function getOrCreateUser(
  firebaseUid: string,
  email: string,
  displayName?: string
) {
  const existing = await prisma.user.findUnique({
    where: { firebaseUid },
    include: { stats: true },
  });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      firebaseUid,
      email,
      displayName,
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
    include: { stats: true },
  });
}

export async function getUserFromFirebaseUid(firebaseUid: string) {
  return prisma.user.findUnique({
    where: { firebaseUid },
    include: { stats: true },
  });
}
