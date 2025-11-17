/*
  Warnings:

  - You are about to drop the column `userId` on the `TokenUsage` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uuid]` on the table `PatientActiveMedication` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `PatientActivity` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `PatientAllergy` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `PatientChartNote` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `PatientDNAResultActivity` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `PatientDNAResultBreakdown` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `PatientDNAResultKit` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `PatientDoctor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `PatientGoal` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `PatientLabResult` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `PatientMedicalRecord` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `PatientMedicalRecordChunk` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `PatientProblemList` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `PatientTreatmentPlan` will be added. If there are existing duplicate values, this will fail.
  - The required column `uuid` was added to the `PatientDoctor` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "TokenUsage" DROP CONSTRAINT "TokenUsage_userId_fkey";

-- AlterTable
ALTER TABLE "PatientActiveMedication" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "PatientActivity" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "PatientAllergy" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "PatientChartNote" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "PatientDNAResultActivity" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "PatientDNAResultBreakdown" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "PatientDNAResultKit" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "PatientDoctor" ADD COLUMN     "uuid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PatientGoal" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "PatientLabResult" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "PatientMedicalRecord" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "PatientMedicalRecordChunk" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "PatientProblemList" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "PatientTreatmentPlan" ADD COLUMN     "uuid" TEXT;

-- AlterTable
ALTER TABLE "TokenUsage" DROP COLUMN "userId";

-- CreateIndex
CREATE UNIQUE INDEX "PatientActiveMedication_uuid_key" ON "PatientActiveMedication"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "PatientActivity_uuid_key" ON "PatientActivity"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "PatientAllergy_uuid_key" ON "PatientAllergy"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "PatientChartNote_uuid_key" ON "PatientChartNote"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "PatientDNAResultActivity_uuid_key" ON "PatientDNAResultActivity"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "PatientDNAResultBreakdown_uuid_key" ON "PatientDNAResultBreakdown"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "PatientDNAResultKit_uuid_key" ON "PatientDNAResultKit"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "PatientDoctor_uuid_key" ON "PatientDoctor"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "PatientGoal_uuid_key" ON "PatientGoal"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "PatientLabResult_uuid_key" ON "PatientLabResult"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "PatientMedicalRecord_uuid_key" ON "PatientMedicalRecord"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "PatientMedicalRecordChunk_uuid_key" ON "PatientMedicalRecordChunk"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "PatientProblemList_uuid_key" ON "PatientProblemList"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "PatientTreatmentPlan_uuid_key" ON "PatientTreatmentPlan"("uuid");
