-- DropForeignKey
ALTER TABLE "MemoryCard" DROP CONSTRAINT "MemoryCard_memory_id_fkey";

-- DropForeignKey
ALTER TABLE "MemoryCard" DROP CONSTRAINT "MemoryCard_user_id_fkey";

-- AddForeignKey
ALTER TABLE "MemoryCard" ADD CONSTRAINT "MemoryCard_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryCard" ADD CONSTRAINT "MemoryCard_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
