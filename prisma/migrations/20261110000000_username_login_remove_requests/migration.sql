-- Login is now a unique username instead of the email address. Email stays as
-- contact information on the account.

ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Backfill from the email local part for existing logins.
UPDATE "User"
SET "username" = LOWER(
  REGEXP_REPLACE(SPLIT_PART("email", '@', 1), '[^a-zA-Z0-9._-]', '', 'g')
);

-- Fall back to a generated value when the local part was empty after cleanup.
UPDATE "User"
SET "username" = 'user-' || SUBSTRING("id" FROM 1 FOR 8)
WHERE "username" IS NULL OR "username" = '';

-- Emails from different domains can share a local part; add a numeric suffix.
WITH ranked AS (
  SELECT
    "id",
    "username",
    ROW_NUMBER() OVER (PARTITION BY "username" ORDER BY "createdAt", "id") AS rn
  FROM "User"
)
UPDATE "User" AS u
SET "username" = ranked."username" || '-' || ranked.rn
FROM ranked
WHERE u."id" = ranked."id" AND ranked.rn > 1;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Self-registration and the admin approval queue are gone. Members are created
-- directly by an administrator from the Members page.
ALTER TABLE "RegistrationRequest" DROP CONSTRAINT "RegistrationRequest_createdUserId_fkey";
ALTER TABLE "RegistrationRequest" DROP CONSTRAINT "RegistrationRequest_reviewedById_fkey";
DROP TABLE "RegistrationRequest";
DROP TYPE "RequestStatus";
