-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EXPERT');

-- CreateEnum
CREATE TYPE "AktionStatus" AS ENUM ('AKTIV', 'ABGESAGT', 'GEAENDERT');

-- CreateEnum
CREATE TYPE "EmailTyp" AS ENUM ('BESTAETIGUNG', 'AENDERUNG', 'ABSAGE', 'TAEGLICHE_UEBERSICHT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EXPERT',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wahlkreisId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wahlkreise" (
    "id" TEXT NOT NULL,
    "nummer" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wahlkreise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aktionen" (
    "id" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "beschreibung" TEXT,
    "datum" DATE NOT NULL,
    "startzeit" TEXT NOT NULL,
    "endzeit" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "wahlkreisId" TEXT NOT NULL,
    "ansprechpersonName" TEXT NOT NULL,
    "ansprechpersonEmail" TEXT NOT NULL,
    "ansprechpersonTelefon" TEXT NOT NULL,
    "maxTeilnehmer" INTEGER,
    "status" "AktionStatus" NOT NULL DEFAULT 'AKTIV',
    "createdById" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aktionen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anmeldungen" (
    "id" TEXT NOT NULL,
    "aktionId" TEXT NOT NULL,
    "vorname" TEXT NOT NULL,
    "nachname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefon" TEXT,
    "signalName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anmeldungen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "typ" "EmailTyp" NOT NULL,
    "empfaengerEmail" TEXT NOT NULL,
    "aktionId" TEXT,
    "gesendetAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wahlkreise_nummer_key" ON "wahlkreise"("nummer");

-- CreateIndex
CREATE UNIQUE INDEX "anmeldungen_aktionId_email_key" ON "anmeldungen"("aktionId", "email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_wahlkreisId_fkey" FOREIGN KEY ("wahlkreisId") REFERENCES "wahlkreise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aktionen" ADD CONSTRAINT "aktionen_wahlkreisId_fkey" FOREIGN KEY ("wahlkreisId") REFERENCES "wahlkreise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aktionen" ADD CONSTRAINT "aktionen_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aktionen" ADD CONSTRAINT "aktionen_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anmeldungen" ADD CONSTRAINT "anmeldungen_aktionId_fkey" FOREIGN KEY ("aktionId") REFERENCES "aktionen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_aktionId_fkey" FOREIGN KEY ("aktionId") REFERENCES "aktionen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
