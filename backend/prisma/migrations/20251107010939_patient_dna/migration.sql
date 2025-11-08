/*
  Warnings:

  - Added the required column `doctorId` to the `PatientActiveMedication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PatientActiveMedication" ADD COLUMN     "doctorId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "PatientActiveMedication" ADD CONSTRAINT "PatientActiveMedication_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientActiveMedication" ADD CONSTRAINT "PatientActiveMedication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
