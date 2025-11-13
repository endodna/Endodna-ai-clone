/*
  Warnings:

  - You are about to drop the `OrphanDNAResultActivity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrphanDNAResultBreakdown` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrphanDNAResultKit` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrphanDNAResultActivity" DROP CONSTRAINT "OrphanDNAResultActivity_orphanDNAResultId_fkey";

-- DropForeignKey
ALTER TABLE "OrphanDNAResultBreakdown" DROP CONSTRAINT "OrphanDNAResultBreakdown_orphanDNAResultId_fkey";

-- DropForeignKey
ALTER TABLE "OrphanDNAResultKit" DROP CONSTRAINT "OrphanDNAResultKit_linkedDNAResultKitId_fkey";

-- DropForeignKey
ALTER TABLE "OrphanDNAResultKit" DROP CONSTRAINT "OrphanDNAResultKit_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrphanDNAResultKit" DROP CONSTRAINT "OrphanDNAResultKit_patientId_fkey";

-- AlterTable
ALTER TABLE "PatientDNAResultKit" ALTER COLUMN "organizationId" DROP NOT NULL,
ALTER COLUMN "patientId" DROP NOT NULL;

-- DropTable
DROP TABLE "OrphanDNAResultActivity";

-- DropTable
DROP TABLE "OrphanDNAResultBreakdown";

-- DropTable
DROP TABLE "OrphanDNAResultKit";
