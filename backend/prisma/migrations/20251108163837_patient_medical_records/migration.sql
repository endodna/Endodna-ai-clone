-- AlterTable
ALTER TABLE "PatientDNAResult" ADD COLUMN     "failedProcessingReason" TEXT,
ADD COLUMN     "isFailedProcessing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isProcessed" BOOLEAN NOT NULL DEFAULT false;
