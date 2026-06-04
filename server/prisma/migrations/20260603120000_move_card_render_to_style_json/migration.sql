-- Move MemoryCard render columns (position_x, position_y, z_index, width, height)
-- into a single nested JSONB column `style`, preserving existing data.

-- 1. Add the new column as nullable so we can backfill it.
ALTER TABLE "MemoryCard" ADD COLUMN "style" JSONB;

-- 2. Backfill from the old columns into the nested shape.
UPDATE "MemoryCard"
SET "style" = jsonb_build_object(
  'position', jsonb_build_object('x', "position_x", 'y', "position_y"),
  'size', jsonb_build_object('width', "width", 'height', "height"),
  'zIndex', "z_index"
);

-- 3. Now that every row is populated, enforce NOT NULL.
ALTER TABLE "MemoryCard" ALTER COLUMN "style" SET NOT NULL;

-- 4. Drop the old columns.
ALTER TABLE "MemoryCard"
  DROP COLUMN "position_x",
  DROP COLUMN "position_y",
  DROP COLUMN "z_index",
  DROP COLUMN "width",
  DROP COLUMN "height";
