-- AlterTable
ALTER TABLE "PatientLabResult" ADD COLUMN     "loincCode" TEXT,
ADD COLUMN     "loincLongName" TEXT;

-- CreateIndex
CREATE INDEX "PatientLabResult_loincCode_idx" ON "PatientLabResult"("loincCode");
