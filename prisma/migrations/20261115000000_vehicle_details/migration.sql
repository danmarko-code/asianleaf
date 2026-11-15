-- Vehicle registration now records type, brand/model and color.
ALTER TABLE "Vehicle" ADD COLUMN "vehicleType" TEXT NOT NULL DEFAULT 'OTHER';
ALTER TABLE "Vehicle" ADD COLUMN "brandModel" TEXT NOT NULL DEFAULT 'Not specified';
ALTER TABLE "Vehicle" ADD COLUMN "color" TEXT NOT NULL DEFAULT 'Not specified';

-- E-bikes without LTO registration share the "N/A" placeholder, so the unique
-- rule has to skip it. Everything else stays unique per member.
DROP INDEX IF EXISTS "Vehicle_memberId_plateNumber_key";
CREATE UNIQUE INDEX "Vehicle_memberId_plateNumber_key"
  ON "Vehicle" ("memberId", "plateNumber")
  WHERE "plateNumber" <> 'N/A';
