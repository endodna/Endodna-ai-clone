/*
  Warnings:

  - The `status` column on the `PatientLabResult` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "PatientLabResult" DROP COLUMN "status",
ADD COLUMN     "status" TEXT;
