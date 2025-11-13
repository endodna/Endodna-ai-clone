-- CreateTable
CREATE TABLE "OrphanDNAResultKit" (
    "id" SERIAL NOT NULL,
    "barcode" TEXT NOT NULL,
    "patientId" TEXT,
    "organizationId" INTEGER,
    "linkedDNAResultKitId" INTEGER,
    "fileMetadata" JSONB NOT NULL DEFAULT '{}',
    "status" "DNAResultStatus" NOT NULL DEFAULT 'PENDING',
    "isFailedProcessing" BOOLEAN NOT NULL DEFAULT false,
    "failedProcessingReason" TEXT,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrphanDNAResultKit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrphanDNAResultBreakdown" (
    "id" SERIAL NOT NULL,
    "orphanDNAResultId" INTEGER NOT NULL,
    "snpName" TEXT NOT NULL,
    "chromosome" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "referenceAllele" TEXT NOT NULL,
    "alternateAllele" TEXT NOT NULL,
    "genotype" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrphanDNAResultBreakdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrphanDNAResultActivity" (
    "id" SERIAL NOT NULL,
    "orphanDNAResultId" INTEGER NOT NULL,
    "activity" TEXT NOT NULL,
    "status" "DNAResultStatus" NOT NULL DEFAULT 'KIT_RECEIVED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrphanDNAResultActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrphanDNAResultKit_id_key" ON "OrphanDNAResultKit"("id");

-- CreateIndex
CREATE UNIQUE INDEX "OrphanDNAResultBreakdown_id_key" ON "OrphanDNAResultBreakdown"("id");

-- CreateIndex
CREATE UNIQUE INDEX "OrphanDNAResultActivity_id_key" ON "OrphanDNAResultActivity"("id");

-- AddForeignKey
ALTER TABLE "OrphanDNAResultKit" ADD CONSTRAINT "OrphanDNAResultKit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrphanDNAResultKit" ADD CONSTRAINT "OrphanDNAResultKit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrphanDNAResultKit" ADD CONSTRAINT "OrphanDNAResultKit_linkedDNAResultKitId_fkey" FOREIGN KEY ("linkedDNAResultKitId") REFERENCES "PatientDNAResultKit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrphanDNAResultBreakdown" ADD CONSTRAINT "OrphanDNAResultBreakdown_orphanDNAResultId_fkey" FOREIGN KEY ("orphanDNAResultId") REFERENCES "OrphanDNAResultKit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrphanDNAResultActivity" ADD CONSTRAINT "OrphanDNAResultActivity_orphanDNAResultId_fkey" FOREIGN KEY ("orphanDNAResultId") REFERENCES "OrphanDNAResultKit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
