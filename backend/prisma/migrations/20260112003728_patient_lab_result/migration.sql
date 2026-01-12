-- AlterTable
ALTER TABLE "PatientLabResult" ADD COLUMN     "medicalRecordId" INTEGER;

-- AddForeignKey
ALTER TABLE "PatientLabResult" ADD CONSTRAINT "PatientLabResult_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "PatientMedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
