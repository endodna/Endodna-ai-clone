/*
  Warnings:

  - You are about to drop the column `sourceFileUrl` on the `PatientLabResult` table. All the data in the column will be lost.
  - Added the required column `organizationId` to the `PatientActiveMedication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `PatientActivity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `PatientAllergy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `PatientChartNote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `PatientGoal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `PatientLabResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `PatientProblemList` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `PatientTreatmentPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PatientActiveMedication" ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PatientActivity" ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PatientAllergy" ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PatientChartNote" ADD COLUMN     "isProcessed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PatientGoal" ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PatientLabResult" DROP COLUMN "sourceFileUrl",
ADD COLUMN     "isProcessed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "organizationId" INTEGER NOT NULL,
ADD COLUMN     "sourceUrl" TEXT;

-- AlterTable
ALTER TABLE "PatientProblemList" ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PatientTreatmentPlan" ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "PatientActivity" ADD CONSTRAINT "PatientActivity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAllergy" ADD CONSTRAINT "PatientAllergy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientActiveMedication" ADD CONSTRAINT "PatientActiveMedication_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientProblemList" ADD CONSTRAINT "PatientProblemList_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientGoal" ADD CONSTRAINT "PatientGoal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientTreatmentPlan" ADD CONSTRAINT "PatientTreatmentPlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientChartNote" ADD CONSTRAINT "PatientChartNote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientLabResult" ADD CONSTRAINT "PatientLabResult_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
