-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ReportOptionType" AS ENUM ('ACTIVATE_COLLECTION_KIT', 'SHIP_DIRECTLY_TO_PATIENT', 'PATIENT_SELF_PURCHASE');

-- AlterTable
ALTER TABLE "PatientDNAResultKit" ADD COLUMN     "reportId" TEXT;

-- CreateTable
CREATE TABLE "PatientOrder" (
    "id" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "reportId" TEXT NOT NULL,
    "reportOption" "ReportOptionType" NOT NULL DEFAULT 'ACTIVATE_COLLECTION_KIT',
    "patientId" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "price" DECIMAL(10,2) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "dnaKitResultId" INTEGER,
    "addressId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "icon" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "genders" TEXT[],
    "price" DECIMAL(10,2) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientReport" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "organizationId" INTEGER NOT NULL,
    "reportId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "patientAddressId" TEXT,

    CONSTRAINT "PatientReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientAddress" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" INTEGER NOT NULL,
    "address" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PatientReport_patientId_organizationId_idx" ON "PatientReport"("patientId", "organizationId");

-- CreateIndex
CREATE INDEX "PatientAddress_patientId_organizationId_idx" ON "PatientAddress"("patientId", "organizationId");

-- AddForeignKey
ALTER TABLE "PatientDNAResultKit" ADD CONSTRAINT "PatientDNAResultKit_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientOrder" ADD CONSTRAINT "PatientOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientOrder" ADD CONSTRAINT "PatientOrder_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientOrder" ADD CONSTRAINT "PatientOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientOrder" ADD CONSTRAINT "PatientOrder_dnaKitResultId_fkey" FOREIGN KEY ("dnaKitResultId") REFERENCES "PatientDNAResultKit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientOrder" ADD CONSTRAINT "PatientOrder_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "PatientAddress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientReport" ADD CONSTRAINT "PatientReport_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientReport" ADD CONSTRAINT "PatientReport_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientReport" ADD CONSTRAINT "PatientReport_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientReport" ADD CONSTRAINT "PatientReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientReport" ADD CONSTRAINT "PatientReport_patientAddressId_fkey" FOREIGN KEY ("patientAddressId") REFERENCES "PatientAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAddress" ADD CONSTRAINT "PatientAddress_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAddress" ADD CONSTRAINT "PatientAddress_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
