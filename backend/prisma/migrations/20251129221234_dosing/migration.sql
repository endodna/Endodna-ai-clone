-- AlterTable
ALTER TABLE "PatientChartNote" ADD COLUMN     "patientDosageHistoryId" TEXT;

-- AddForeignKey
ALTER TABLE "PatientChartNote" ADD CONSTRAINT "PatientChartNote_patientDosageHistoryId_fkey" FOREIGN KEY ("patientDosageHistoryId") REFERENCES "PatientDosageHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
