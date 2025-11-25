-- CreateTable
CREATE TABLE "PatientInfo" (
    "id" TEXT NOT NULL,
    "weight" INTEGER,
    "height" INTEGER,
    "bloodType" TEXT,
    "bmi" INTEGER,
    "prefilledData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "patientId" TEXT NOT NULL,

    CONSTRAINT "PatientInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientInfo_id_key" ON "PatientInfo"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientInfo_patientId_key" ON "PatientInfo"("patientId");

-- AddForeignKey
ALTER TABLE "PatientInfo" ADD CONSTRAINT "PatientInfo_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientInfo" ADD CONSTRAINT "PatientInfo_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
