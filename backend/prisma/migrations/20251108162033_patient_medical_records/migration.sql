/*
  Warnings:

  - Made the column `sourceUrl` on table `PatientMedicalRecord` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fileMetadata` on table `PatientMedicalRecord` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PatientMedicalRecord" ADD COLUMN     "failedProcessingReason" TEXT,
ADD COLUMN     "isFailedProcessing" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "content" DROP NOT NULL,
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "sourceUrl" SET NOT NULL,
ALTER COLUMN "fileMetadata" SET NOT NULL,
ALTER COLUMN "fileMetadata" SET DEFAULT '{}';
