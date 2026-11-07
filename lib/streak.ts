import { prisma } from "@/lib/prisma";

/**
 * Streak rules:
 * - A day is defined as a calendar day in UTC.
 * - Doing ANY reading activity (adding a word, reviewing a card) counts as
 *   "reading today".
 * - Streak increments by 1 when the user's first activity of a new day is
 *   recorded, AS LONG AS the previous activity was yesterday (streak
 *   continues) or today already (no-op).
 * - If the last activity was 2+ days ago AND the user has a streak freeze,
 *   one freeze is consumed and the streak is preserved.
 * - If the last activity was 2+ days ago AND no freeze is available, the
 *   streak resets to 1 (today counts as day 1).
 * - longestStreak is updated whenever currentStreak exceeds it.
 */

function toUTCDay(date: Date): string {
  // Returns "YYYY-MM-DD" in UTC
  return date.toISOString().slice(0, 10);
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86_400_000;
  const aDay = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bDay = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round(Math.abs(bDay - aDay) / msPerDay);
}

export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  lastReadDate: Date;
  /** What happened this call */
  event: "no_change" | "incremented" | "freeze_used" | "reset";
}

/**
 * Call this whenever a user performs a reading activity (review, add word,
 * log pages). It computes the new streak state and writes it to the DB.
 *
 * @param userId  The DB user.id (not Firebase UID)
 */
export async function updateStreak(userId: string): Promise<StreakUpdateResult> {
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  if (!stats) throw new Error(`No UserStats found for userId: ${userId}`);

  const now = new Date();
  const todayStr = toUTCDay(now);

  // If already recorded activity today, nothing to do
  if (stats.lastReadDate && toUTCDay(stats.lastReadDate) === todayStr) {
    return {
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      streakFreezes: stats.streakFreezes,
      lastReadDate: stats.lastReadDate,
      event: "no_change",
    };
  }

  let newStreak = stats.currentStreak;
  let newFreezes = stats.streakFreezes;
  let event: StreakUpdateResult["event"] = "incremented";

  if (!stats.lastReadDate) {
    // First ever activity
    newStreak = 1;
    event = "incremented";
  } else {
    const gap = daysBetween(stats.lastReadDate, now);

    if (gap === 1) {
      // Consecutive day — increment
      newStreak += 1;
      event = "incremented";
    } else if (gap >= 2) {
      if (newFreezes > 0) {
        // Missed day(s) but freeze absorbs it — preserve streak, consume freeze
        newFreezes -= 1;
        // Still increment because today counts
        newStreak += 1;
        event = "freeze_used";
      } else {
        // No freeze — reset to 1
        newStreak = 1;
        event = "reset";
      }
    }
  }

  const newLongest = Math.max(stats.longestStreak, newStreak);

  const updated = await prisma.userStats.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      streakFreezes: newFreezes,
      lastReadDate: now,
    },
  });

  return {
    currentStreak: updated.currentStreak,
    longestStreak: updated.longestStreak,
    streakFreezes: updated.streakFreezes,
    lastReadDate: updated.lastReadDate!,
    event,
  };
}
