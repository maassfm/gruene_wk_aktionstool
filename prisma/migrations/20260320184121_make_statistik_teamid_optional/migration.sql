-- DropForeignKey
ALTER TABLE "aktion_statistiken" DROP CONSTRAINT "aktion_statistiken_teamId_fkey";

-- AlterTable
ALTER TABLE "aktion_statistiken" ALTER COLUMN "teamId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "aktion_statistiken" ADD CONSTRAINT "aktion_statistiken_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
