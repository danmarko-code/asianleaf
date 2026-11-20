-- Homeowner-submitted payments: link directly to the household, allow a
-- payment without an open billing period, store an optional receipt image and
-- accept an "Other" method.

ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'OTHER';

ALTER TABLE "Payment" ALTER COLUMN "dueId" DROP NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "referenceNumber" DROP NOT NULL;

ALTER TABLE "Payment" ADD COLUMN "householdId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "receiptUrl" TEXT;

-- Existing rows always had a due, so the household is recoverable from it.
UPDATE "Payment" SET "householdId" = "Due"."householdId"
FROM "Due" WHERE "Payment"."dueId" = "Due"."id";

DELETE FROM "Payment" WHERE "householdId" IS NULL;

ALTER TABLE "Payment" ALTER COLUMN "householdId" SET NOT NULL;

ALTER TABLE "Payment" DROP CONSTRAINT "Payment_dueId_fkey";
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_dueId_fkey" FOREIGN KEY ("dueId") REFERENCES "Due"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Payment_householdId_idx" ON "Payment"("householdId");
