-- AlterTable
ALTER TABLE "PatientAddress" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PatientOrder" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PatientReport" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "deletedAt" TIMESTAMP(3);
