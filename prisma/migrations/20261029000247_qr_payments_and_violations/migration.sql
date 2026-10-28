-- CreateEnum
CREATE TYPE "PaymentChannelType" AS ENUM ('GCASH', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "ViolationKind" AS ENUM ('WARNING', 'PAYMENT_REQUIRED');

-- CreateEnum
CREATE TYPE "ViolationStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('GCASH', 'BANK_TRANSFER');
ALTER TABLE "Payment" ALTER COLUMN "method" TYPE "PaymentMethod_new" USING ("method"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'PAID', 'REJECTED');
ALTER TABLE "public"."Payment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Payment" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "Payment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropIndex
DROP INDEX "Payment_providerCheckoutId_key";

-- DropIndex
DROP INDEX "Payment_providerPaymentId_key";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "failureReason",
DROP COLUMN "provider",
DROP COLUMN "providerCheckoutId",
DROP COLUMN "providerPaymentId",
DROP COLUMN "webhookPayload",
ADD COLUMN     "channelId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- CreateTable
CREATE TABLE "PaymentChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PaymentChannelType" NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "qrImageUrl" TEXT,
    "instructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Violation" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "memberId" TEXT,
    "kind" "ViolationKind" NOT NULL DEFAULT 'WARNING',
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ViolationStatus" NOT NULL DEFAULT 'OPEN',
    "fineAmount" DECIMAL(10,2),
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATE,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "issuedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Violation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentChannel_isActive_sortOrder_idx" ON "PaymentChannel"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Violation_householdId_status_idx" ON "Violation"("householdId", "status");

-- CreateIndex
CREATE INDEX "Violation_status_idx" ON "Violation"("status");

-- CreateIndex
CREATE INDEX "Payment_channelId_idx" ON "Payment"("channelId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "PaymentChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
