/*
  Warnings:

  - The `type` column on the `PatientMedicalRecord` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "MedicalRecordType" AS ENUM ('CONSULTATION', 'DIAGNOSIS', 'TREATMENT', 'FOLLOW_UP', 'EMERGENCY', 'LAB_RESULT', 'IMAGING');

-- AlterTable
ALTER TABLE "PatientMedicalRecord" ADD COLUMN     "fileMetadata" JSONB,
DROP COLUMN "type",
ADD COLUMN     "type" "MedicalRecordType" DEFAULT 'CONSULTATION';
