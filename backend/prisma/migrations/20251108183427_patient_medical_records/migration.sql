/*
  Warnings:

  - The values [QUESTION_ANSWERING,CHART_NOTE_GENERATION] on the enum `TaskType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TaskType_new" AS ENUM ('MEDICAL_RECORD_PROCESSING', 'PATIENT_SUMMARY_GENERATION', 'DOCUMENT_EMBEDDING', 'SIMILARITY_SEARCH', 'TREATMENT_PLAN_GENERATION', 'DIAGNOSIS_ASSISTANCE', 'OTHER');
ALTER TABLE "TokenUsage" ALTER COLUMN "taskType" TYPE "TaskType_new" USING ("taskType"::text::"TaskType_new");
ALTER TYPE "TaskType" RENAME TO "TaskType_old";
ALTER TYPE "TaskType_new" RENAME TO "TaskType";
DROP TYPE "public"."TaskType_old";
COMMIT;

-- DropIndex
DROP INDEX "TokenUsage_modelId_createdAt_idx";

-- DropIndex
DROP INDEX "TokenUsage_organizationId_createdAt_idx";

-- DropIndex
DROP INDEX "TokenUsage_patientId_createdAt_idx";

-- DropIndex
DROP INDEX "TokenUsage_requestType_createdAt_idx";

-- DropIndex
DROP INDEX "TokenUsage_taskId_taskType_createdAt_idx";

-- DropIndex
DROP INDEX "TokenUsage_taskType_createdAt_idx";
