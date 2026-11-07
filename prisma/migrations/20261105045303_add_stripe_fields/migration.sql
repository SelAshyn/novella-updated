/*
  Warnings:

  - A unique constraint covering the columns `[stripeCustomerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `UserStats` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;

-- AlterTable
ALTER TABLE "UserStats" ADD COLUMN "stripeCurrentPeriodEnd" DATETIME;
ALTER TABLE "UserStats" ADD COLUMN "stripeSubscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "User_stripeCustomerId_idx" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStats_stripeSubscriptionId_key" ON "UserStats"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "UserStats_stripeSubscriptionId_idx" ON "UserStats"("stripeSubscriptionId");
