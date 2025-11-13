-- CreateEnum
CREATE TYPE "ChatType" AS ENUM ('SUMMARY', 'TREATMENT_PLAN', 'GENERAL');

-- CreateEnum
CREATE TYPE "ChatMessageRole" AS ENUM ('SYSTEM', 'USER', 'ASSISTANT');

-- AlterTable
ALTER TABLE "PatientDNAResultKit" ALTER COLUMN "status" SET DEFAULT 'PENDING';
