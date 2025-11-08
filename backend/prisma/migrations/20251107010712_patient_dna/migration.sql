-- AlterTable
ALTER TABLE "PatientActiveMedication" ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "endDate" DROP NOT NULL,
ALTER COLUMN "notes" DROP NOT NULL;
