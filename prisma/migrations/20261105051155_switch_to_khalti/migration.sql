/*
  Warnings:

  - You are about to drop the column `stripeCustomerId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCurrentPeriodEnd` on the `UserStats` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSubscriptionId` on the `UserStats` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firebaseUid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "khaltiCustomerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "displayName", "email", "firebaseUid", "id", "updatedAt") SELECT "createdAt", "displayName", "email", "firebaseUid", "id", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_khaltiCustomerId_key" ON "User"("khaltiCustomerId");
CREATE INDEX "User_firebaseUid_idx" ON "User"("firebaseUid");
CREATE INDEX "User_khaltiCustomerId_idx" ON "User"("khaltiCustomerId");
CREATE TABLE "new_UserStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "totalBooksRead" INTEGER NOT NULL DEFAULT 0,
    "totalPagesRead" INTEGER NOT NULL DEFAULT 0,
    "totalWordsLearned" INTEGER NOT NULL DEFAULT 0,
    "totalQuotesCollected" INTEGER NOT NULL DEFAULT 0,
    "lastReadDate" DATETIME,
    "streakFreezes" INTEGER NOT NULL DEFAULT 1,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "khaltiSubscriptionId" TEXT,
    "subscriptionEndDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserStats" ("createdAt", "currentStreak", "id", "lastReadDate", "longestStreak", "plan", "streakFreezes", "theme", "totalBooksRead", "totalPagesRead", "totalQuotesCollected", "totalWordsLearned", "updatedAt", "userId") SELECT "createdAt", "currentStreak", "id", "lastReadDate", "longestStreak", "plan", "streakFreezes", "theme", "totalBooksRead", "totalPagesRead", "totalQuotesCollected", "totalWordsLearned", "updatedAt", "userId" FROM "UserStats";
DROP TABLE "UserStats";
ALTER TABLE "new_UserStats" RENAME TO "UserStats";
CREATE UNIQUE INDEX "UserStats_userId_key" ON "UserStats"("userId");
CREATE UNIQUE INDEX "UserStats_khaltiSubscriptionId_key" ON "UserStats"("khaltiSubscriptionId");
CREATE INDEX "UserStats_khaltiSubscriptionId_idx" ON "UserStats"("khaltiSubscriptionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
