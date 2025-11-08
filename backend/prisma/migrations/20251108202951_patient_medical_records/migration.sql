-- CreateTable
CREATE TABLE "PatientDNAResultBreakdown" (
    "id" SERIAL NOT NULL,
    "patientDNAResultId" INTEGER NOT NULL,
    "snpName" TEXT NOT NULL,
    "chromosome" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "referenceAllele" TEXT NOT NULL,
    "alternateAllele" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientDNAResultBreakdown_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientDNAResultBreakdown_id_key" ON "PatientDNAResultBreakdown"("id");

-- AddForeignKey
ALTER TABLE "PatientDNAResultBreakdown" ADD CONSTRAINT "PatientDNAResultBreakdown_patientDNAResultId_fkey" FOREIGN KEY ("patientDNAResultId") REFERENCES "PatientDNAResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
