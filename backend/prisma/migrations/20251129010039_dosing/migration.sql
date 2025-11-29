-- CreateEnum
CREATE TYPE "DosageTier" AS ENUM ('conservative', 'standard', 'aggressive', 'high_performance');

-- CreateEnum
CREATE TYPE "DosageHistoryType" AS ENUM ('T100', 'T200', 'ESTRADIOL');

-- AlterTable
ALTER TABLE "PatientActiveMedication" ADD COLUMN     "patientDosageHistoryId" TEXT;

-- CreateTable
CREATE TABLE "PatientDosageHistory" (
    "id" TEXT NOT NULL,
    "data" JSONB,
    "type" "DosageHistoryType" NOT NULL,
    "tier" "DosageTier" NOT NULL,
    "isOverridden" BOOLEAN NOT NULL DEFAULT false,
    "doctorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "patientId" TEXT NOT NULL,

    CONSTRAINT "PatientDosageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientDosageHistory_id_key" ON "PatientDosageHistory"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientDosageHistory_patientId_key" ON "PatientDosageHistory"("patientId");

-- AddForeignKey
ALTER TABLE "PatientDosageHistory" ADD CONSTRAINT "PatientDosageHistory_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientDosageHistory" ADD CONSTRAINT "PatientDosageHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientDosageHistory" ADD CONSTRAINT "PatientDosageHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientActiveMedication" ADD CONSTRAINT "PatientActiveMedication_patientDosageHistoryId_fkey" FOREIGN KEY ("patientDosageHistoryId") REFERENCES "PatientDosageHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
