/*
  Warnings:

  - You are about to drop the `PatientChartNote` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PatientChartNote" DROP CONSTRAINT "PatientChartNote_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "PatientChartNote" DROP CONSTRAINT "PatientChartNote_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "PatientChartNote" DROP CONSTRAINT "PatientChartNote_patientId_fkey";

-- DropTable
DROP TABLE "PatientChartNote";

-- CreateTable
CREATE TABLE "PatientMedicalRecord" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "patientId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "doctorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientMedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientMedicalRecord_id_key" ON "PatientMedicalRecord"("id");

-- AddForeignKey
ALTER TABLE "PatientMedicalRecord" ADD CONSTRAINT "PatientMedicalRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientMedicalRecord" ADD CONSTRAINT "PatientMedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientMedicalRecord" ADD CONSTRAINT "PatientMedicalRecord_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
