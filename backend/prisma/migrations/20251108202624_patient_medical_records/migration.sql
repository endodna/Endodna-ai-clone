-- AlterTable
ALTER TABLE "PatientDNAResult" ADD COLUMN     "fileMetadata" JSONB NOT NULL DEFAULT '{}';
