/*
  Warnings:

  - You are about to drop the column `userId` on the `PatientActiveMedication` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PatientActiveMedication" DROP CONSTRAINT "PatientActiveMedication_userId_fkey";

-- AlterTable
ALTER TABLE "PatientActiveMedication" DROP COLUMN "userId";
