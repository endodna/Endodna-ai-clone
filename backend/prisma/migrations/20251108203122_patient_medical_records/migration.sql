/*
  Warnings:

  - You are about to drop the `PatientDNAResult` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PatientDNAResult" DROP CONSTRAINT "PatientDNAResult_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "PatientDNAResult" DROP CONSTRAINT "PatientDNAResult_patientId_fkey";

-- DropForeignKey
ALTER TABLE "PatientDNAResultActivity" DROP CONSTRAINT "PatientDNAResultActivity_patientDNAResultId_fkey";

-- DropForeignKey
ALTER TABLE "PatientDNAResultBreakdown" DROP CONSTRAINT "PatientDNAResultBreakdown_patientDNAResultId_fkey";

-- DropTable
DROP TABLE "PatientDNAResult";

-- CreateTable
CREATE TABLE "PatientDNAResultKit" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "patientId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "fileMetadata" JSONB NOT NULL DEFAULT '{}',
    "status" "DNAResultStatus" NOT NULL DEFAULT 'KIT_RECEIVED',
    "isFailedProcessing" BOOLEAN NOT NULL DEFAULT false,
    "failedProcessingReason" TEXT,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientDNAResultKit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientDNAResultKit_id_key" ON "PatientDNAResultKit"("id");

-- AddForeignKey
ALTER TABLE "PatientDNAResultKit" ADD CONSTRAINT "PatientDNAResultKit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientDNAResultKit" ADD CONSTRAINT "PatientDNAResultKit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientDNAResultBreakdown" ADD CONSTRAINT "PatientDNAResultBreakdown_patientDNAResultId_fkey" FOREIGN KEY ("patientDNAResultId") REFERENCES "PatientDNAResultKit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientDNAResultActivity" ADD CONSTRAINT "PatientDNAResultActivity_patientDNAResultId_fkey" FOREIGN KEY ("patientDNAResultId") REFERENCES "PatientDNAResultKit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
