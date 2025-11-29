/*
  Warnings:

  - You are about to drop the column `dosageMg` on the `PatientDosageHistory` table. All the data in the column will be lost.
  - You are about to drop the column `pelletsCount` on the `PatientDosageHistory` table. All the data in the column will be lost.
  - You are about to drop the column `tier` on the `PatientDosageHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PatientDosageHistory" DROP COLUMN "dosageMg",
DROP COLUMN "pelletsCount",
DROP COLUMN "tier";
