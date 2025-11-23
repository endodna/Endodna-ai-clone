/*
  Warnings:

  - You are about to drop the column `reportOption` on the `PatientOrder` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('ACTIVATE_COLLECTION_KIT', 'SHIP_DIRECTLY_TO_PATIENT', 'PATIENT_SELF_PURCHASE');

-- AlterTable
ALTER TABLE "PatientDNAResultActivity" ADD COLUMN     "doctorId" TEXT;

-- AlterTable
ALTER TABLE "PatientOrder" DROP COLUMN "reportOption",
ADD COLUMN     "orderType" "OrderType" NOT NULL DEFAULT 'ACTIVATE_COLLECTION_KIT';

-- DropEnum
DROP TYPE "ReportOptionType";

-- AddForeignKey
ALTER TABLE "PatientDNAResultActivity" ADD CONSTRAINT "PatientDNAResultActivity_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
