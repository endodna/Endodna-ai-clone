/*
  Warnings:

  - Added the required column `dosageMg` to the `PatientDosageHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pelletsCount` to the `PatientDosageHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PatientDosageHistory" ADD COLUMN     "dosageMg" INTEGER NOT NULL,
ADD COLUMN     "pelletsCount" INTEGER NOT NULL;
