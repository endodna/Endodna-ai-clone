/*
  Warnings:

  - The primary key for the `PatientActiveMedication` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `PatientActiveMedication` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `PatientActivity` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `PatientActivity` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `PatientAllergy` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `PatientAllergy` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `PatientChartNote` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `PatientChartNote` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `PatientDoctor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `PatientDoctor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `PatientGoal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `PatientGoal` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `PatientLabResult` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `PatientLabResult` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `PatientProblemList` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `PatientProblemList` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `PatientTreatmentPlan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `PatientTreatmentPlan` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "PatientActiveMedication" DROP CONSTRAINT "PatientActiveMedication_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "PatientActiveMedication_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PatientActivity" DROP CONSTRAINT "PatientActivity_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "PatientActivity_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PatientAllergy" DROP CONSTRAINT "PatientAllergy_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "PatientAllergy_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PatientChartNote" DROP CONSTRAINT "PatientChartNote_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "PatientChartNote_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PatientDoctor" DROP CONSTRAINT "PatientDoctor_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "PatientDoctor_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PatientGoal" DROP CONSTRAINT "PatientGoal_pkey",
ADD COLUMN     "allergies" INTEGER[],
ADD COLUMN     "medications" INTEGER[],
ADD COLUMN     "problems" INTEGER[],
ADD COLUMN     "treatments" INTEGER[],
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "PatientGoal_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PatientLabResult" DROP CONSTRAINT "PatientLabResult_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "PatientLabResult_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PatientProblemList" DROP CONSTRAINT "PatientProblemList_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "PatientProblemList_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PatientTreatmentPlan" DROP CONSTRAINT "PatientTreatmentPlan_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "PatientTreatmentPlan_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientActiveMedication_id_key" ON "PatientActiveMedication"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientActivity_id_key" ON "PatientActivity"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientAllergy_id_key" ON "PatientAllergy"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientChartNote_id_key" ON "PatientChartNote"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientDoctor_id_key" ON "PatientDoctor"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientGoal_id_key" ON "PatientGoal"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientLabResult_id_key" ON "PatientLabResult"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientProblemList_id_key" ON "PatientProblemList"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientTreatmentPlan_id_key" ON "PatientTreatmentPlan"("id");
