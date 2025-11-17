/*
  Warnings:

  - Made the column `uuid` on table `PatientActiveMedication` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `PatientActivity` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `PatientAllergy` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `PatientChartNote` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `PatientDNAResultActivity` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `PatientDNAResultBreakdown` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `PatientDNAResultKit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `PatientGoal` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `PatientLabResult` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `PatientMedicalRecord` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `PatientMedicalRecordChunk` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `PatientProblemList` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `PatientTreatmentPlan` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PatientActiveMedication" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "PatientActivity" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "PatientAllergy" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "PatientChartNote" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "PatientDNAResultActivity" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "PatientDNAResultBreakdown" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "PatientDNAResultKit" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "PatientGoal" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "PatientLabResult" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "PatientMedicalRecord" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "PatientMedicalRecordChunk" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "PatientProblemList" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "PatientTreatmentPlan" ALTER COLUMN "uuid" SET NOT NULL;
