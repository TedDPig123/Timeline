-- Add the client-side encryption wrapping bundle to the User row.
-- All columns are nullable (null = the user has not set up encryption yet),
-- so this is safe on existing rows with no backfill required.

ALTER TABLE "User"
  ADD COLUMN "crypto_version" INTEGER,
  ADD COLUMN "passphrase_salt" TEXT,
  ADD COLUMN "recovery_salt" TEXT,
  ADD COLUMN "wrapped_dek_passphrase" TEXT,
  ADD COLUMN "wrapped_dek_passphrase_iv" TEXT,
  ADD COLUMN "wrapped_dek_recovery" TEXT,
  ADD COLUMN "wrapped_dek_recovery_iv" TEXT;
