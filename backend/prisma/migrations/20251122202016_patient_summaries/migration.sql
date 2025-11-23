-- CreateTable
CREATE TABLE "PatientSummary" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "followUpPrompts" JSONB,
    "context" JSONB,
    "citations" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PatientSummary_patientId_organizationId_idx" ON "PatientSummary"("patientId", "organizationId");

-- AddForeignKey
ALTER TABLE "PatientSummary" ADD CONSTRAINT "PatientSummary_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientSummary" ADD CONSTRAINT "PatientSummary_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientSummary" ADD CONSTRAINT "PatientSummary_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
