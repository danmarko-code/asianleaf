-- Structured unit details used by registration, admin review and member filters.
ALTER TABLE "Household"
  ADD COLUMN "phase" TEXT,
  ADD COLUMN "street" TEXT;

ALTER TABLE "RegistrationRequest"
  ADD COLUMN "phase" TEXT,
  ADD COLUMN "street" TEXT,
  ADD COLUMN "block" TEXT,
  ADD COLUMN "lot" TEXT;

-- The block/lot pair is unique within a phase. Legacy rows keep null parts and
-- PostgreSQL allows multiple nulls, so they do not collide.
CREATE UNIQUE INDEX "Household_phase_block_lot_key"
  ON "Household"("phase", "block", "lot");

CREATE INDEX "Household_street_idx" ON "Household"("street");
CREATE INDEX "Household_phase_block_lot_idx"
  ON "Household"("phase", "block", "lot");
