-- Add the per-card content IV for client-side encryption of TEXT content.
-- Nullable: a null IV marks legacy plaintext content (encrypted at the later
-- migrate-at-first-unlock pass). Safe on existing rows, no backfill.

ALTER TABLE "MemoryCard" ADD COLUMN "content_iv" TEXT;
