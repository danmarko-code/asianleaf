-- Remove the OTP machinery. Password recovery is now an admin-only reset.
DROP TABLE IF EXISTS "OtpCode";
DROP TYPE IF EXISTS "OtpPurpose";
DROP TYPE IF EXISTS "OtpChannel";

-- Remove email everywhere. Login is username-only, and residents are reached
-- through their contact number.
DROP INDEX IF EXISTS "Member_email_idx";
ALTER TABLE "Member" DROP COLUMN IF EXISTS "email";

DROP INDEX IF EXISTS "User_email_key";
ALTER TABLE "User" DROP COLUMN IF EXISTS "email";
