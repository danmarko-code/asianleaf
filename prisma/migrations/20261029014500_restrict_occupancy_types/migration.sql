-- Normalize legacy occupancy before removing the value.
UPDATE "Member"
SET "occupancyType" = 'OWNER_OCCUPIED'
WHERE "occupancyType" = 'OWNER_NON_OCCUPIED';

-- AlterEnum
ALTER TYPE "OccupancyType" RENAME TO "OccupancyType_old";
CREATE TYPE "OccupancyType" AS ENUM ('OWNER_OCCUPIED', 'TENANT');
ALTER TABLE "Member"
  ALTER COLUMN "occupancyType" TYPE "OccupancyType"
  USING ("occupancyType"::text::"OccupancyType");
DROP TYPE "OccupancyType_old";
