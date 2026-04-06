-- AlterTable
ALTER TABLE "anmeldungen" ADD COLUMN "cancelToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "anmeldungen_cancelToken_key" ON "anmeldungen"("cancelToken");
