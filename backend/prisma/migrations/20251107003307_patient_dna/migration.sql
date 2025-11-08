-- CreateEnum
CREATE TYPE "DNAResultStatus" AS ENUM ('KIT_RECEIVED', 'QC_FAILED', 'QC_PASSED', 'DNA_EXTRACTION_2ND_FAILED', 'DNA_EXTRACTION_FAILED', 'DNA_EXTRACTION_2ND_ACCEPTED', 'DNA_EXTRACTION_ACCEPTED', 'GENOTYPING_2ND_FAILED', 'GENOTYPING_FAILED', 'GENOTYPING_2ND_ACCEPTED', 'GENOTYPING_ACCEPTED', 'HOLD', 'PROCESS', 'CANCEL', 'DISCARD');

-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'READY';

-- CreateTable
CREATE TABLE "PatientDNAResult" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "patientId" TEXT NOT NULL,
    "dnaResult" JSONB,
    "barcode" TEXT,
    "sourceUrl" TEXT,
    "status" "DNAResultStatus" NOT NULL DEFAULT 'KIT_RECEIVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientDNAResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientDNAResultActivity" (
    "id" SERIAL NOT NULL,
    "patientDNAResultId" INTEGER NOT NULL,
    "activity" TEXT NOT NULL,
    "status" "DNAResultStatus" NOT NULL DEFAULT 'KIT_RECEIVED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientDNAResultActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientDNAResult_id_key" ON "PatientDNAResult"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientDNAResultActivity_id_key" ON "PatientDNAResultActivity"("id");

-- AddForeignKey
ALTER TABLE "PatientDNAResult" ADD CONSTRAINT "PatientDNAResult_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientDNAResult" ADD CONSTRAINT "PatientDNAResult_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientDNAResultActivity" ADD CONSTRAINT "PatientDNAResultActivity_patientDNAResultId_fkey" FOREIGN KEY ("patientDNAResultId") REFERENCES "PatientDNAResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
