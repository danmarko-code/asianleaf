-- Convert any existing PARTIALLY_PAID dues to UNPAID before altering the enum
UPDATE "Due" SET "status" = 'UNPAID' WHERE "status"::text = 'PARTIALLY_PAID';

-- AlterEnum: Remove PARTIALLY_PAID from DueStatus
BEGIN;
CREATE TYPE "DueStatus_new" AS ENUM ('UNPAID', 'PAID', 'WAIVED');
ALTER TABLE "public"."Due" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Due" ALTER COLUMN "status" TYPE "DueStatus_new" USING ("status"::text::"DueStatus_new");
ALTER TYPE "DueStatus" RENAME TO "DueStatus_old";
ALTER TYPE "DueStatus_new" RENAME TO "DueStatus";
DROP TYPE "public"."DueStatus_old";
ALTER TABLE "Due" ALTER COLUMN "status" SET DEFAULT 'UNPAID';
COMMIT;
