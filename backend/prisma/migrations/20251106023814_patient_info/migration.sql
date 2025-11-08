/*
  Warnings:

  - You are about to drop the `UserDoctor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPatientActivity` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Status" ADD VALUE 'ACHIEVED';
ALTER TYPE "Status" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "Status" ADD VALUE 'CANCELLED';
ALTER TYPE "Status" ADD VALUE 'RESOLVED';
ALTER TYPE "Status" ADD VALUE 'IN_RANGE';
ALTER TYPE "Status" ADD VALUE 'OUT_OF_RANGE';
ALTER TYPE "Status" ADD VALUE 'LOW';
ALTER TYPE "Status" ADD VALUE 'HIGH';
ALTER TYPE "Status" ADD VALUE 'ANOMALOUS';

-- DropForeignKey
ALTER TABLE "UserDoctor" DROP CONSTRAINT "UserDoctor_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "UserDoctor" DROP CONSTRAINT "UserDoctor_patientId_fkey";

-- DropForeignKey
ALTER TABLE "UserPatientActivity" DROP CONSTRAINT "UserPatientActivity_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" JSONB,
ADD COLUMN     "emergencyContact" JSONB,
ADD COLUMN     "managingDoctorId" TEXT,
ADD COLUMN     "phoneNumber" TEXT;

-- DropTable
DROP TABLE "UserDoctor";

-- DropTable
DROP TABLE "UserPatientActivity";

-- CreateTable
CREATE TABLE "PatientActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "dateRequested" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "dateCompleted" TIMESTAMP(3),
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientDoctor" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "dateRemoved" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientDoctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientAllergy" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "reactionType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientAllergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientActiveMedication" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientActiveMedication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientProblemList" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT NOT NULL,
    "onsetDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientProblemList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientGoal" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientTreatmentPlan" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "planContent" JSONB,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "sourceTemplateId" TEXT,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientTreatmentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientChartNote" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "doctorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientChartNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientLabResult" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "bioMarkerName" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "referenceRange" TEXT,
    "status" "Status",
    "collectionDate" TIMESTAMP(3),
    "reportName" TEXT,
    "reportData" JSONB,
    "sourceFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientLabResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientActivity_id_key" ON "PatientActivity"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientDoctor_id_key" ON "PatientDoctor"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientAllergy_id_key" ON "PatientAllergy"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientActiveMedication_id_key" ON "PatientActiveMedication"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientProblemList_id_key" ON "PatientProblemList"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientGoal_id_key" ON "PatientGoal"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientTreatmentPlan_id_key" ON "PatientTreatmentPlan"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientChartNote_id_key" ON "PatientChartNote"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientLabResult_id_key" ON "PatientLabResult"("id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managingDoctorId_fkey" FOREIGN KEY ("managingDoctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientActivity" ADD CONSTRAINT "PatientActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientDoctor" ADD CONSTRAINT "PatientDoctor_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientDoctor" ADD CONSTRAINT "PatientDoctor_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAllergy" ADD CONSTRAINT "PatientAllergy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientActiveMedication" ADD CONSTRAINT "PatientActiveMedication_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientProblemList" ADD CONSTRAINT "PatientProblemList_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientGoal" ADD CONSTRAINT "PatientGoal_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientTreatmentPlan" ADD CONSTRAINT "PatientTreatmentPlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientChartNote" ADD CONSTRAINT "PatientChartNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientChartNote" ADD CONSTRAINT "PatientChartNote_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientLabResult" ADD CONSTRAINT "PatientLabResult_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
