-- CreateTable
CREATE TABLE "aktion_statistiken" (
    "id" TEXT NOT NULL,
    "aktionId" TEXT NOT NULL,
    "anmeldungenCount" INTEGER NOT NULL,
    "aktionDatum" DATE NOT NULL,
    "wahlkreisId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "geloeschtAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aktion_statistiken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aktion_statistiken_aktionId_key" ON "aktion_statistiken"("aktionId");

-- AddForeignKey
ALTER TABLE "aktion_statistiken" ADD CONSTRAINT "aktion_statistiken_aktionId_fkey" FOREIGN KEY ("aktionId") REFERENCES "aktionen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aktion_statistiken" ADD CONSTRAINT "aktion_statistiken_wahlkreisId_fkey" FOREIGN KEY ("wahlkreisId") REFERENCES "wahlkreise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aktion_statistiken" ADD CONSTRAINT "aktion_statistiken_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
