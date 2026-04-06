-- DropForeignKey
ALTER TABLE "aktionen" DROP CONSTRAINT "aktionen_teamId_fkey";

-- AddForeignKey
ALTER TABLE "aktionen" ADD CONSTRAINT "aktionen_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
