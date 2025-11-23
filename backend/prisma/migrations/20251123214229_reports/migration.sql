/*
  Warnings:

  - You are about to drop the column `patientAddressId` on the `PatientReport` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PatientReport" DROP CONSTRAINT "PatientReport_patientAddressId_fkey";

-- AlterTable
ALTER TABLE "PatientReport" DROP COLUMN "patientAddressId";
