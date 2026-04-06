-- AlterTable: make teamId nullable on aktionen
ALTER TABLE "aktionen" ALTER COLUMN "teamId" DROP NOT NULL;
