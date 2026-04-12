/*
  Warnings:

  - You are about to drop the column `content` on the `Memory` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Memory` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,date]` on the table `Memory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `date` to the `Memory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `MemoryCard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `MemoryCard` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Memory" DROP COLUMN "content",
DROP COLUMN "type",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "MemoryCard" ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "type" "ContentType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Memory_user_id_date_key" ON "Memory"("user_id", "date");
