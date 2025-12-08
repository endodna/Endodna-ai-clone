-- AlterTable
ALTER TABLE "PatientDNAResultBreakdown" ADD COLUMN     "masterSNPId" INTEGER;

-- CreateTable
CREATE TABLE "MasterSNP" (
    "id" SERIAL NOT NULL,
    "rsId" TEXT NOT NULL,
    "geneName" TEXT NOT NULL,
    "geneSummary" TEXT NOT NULL,
    "chromosome" INTEGER NOT NULL,
    "position_GRCh38" INTEGER NOT NULL,
    "referenceAllele" TEXT NOT NULL,
    "altAllele" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterSNP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MasterSNP_id_key" ON "MasterSNP"("id");

-- AddForeignKey
ALTER TABLE "PatientDNAResultBreakdown" ADD CONSTRAINT "PatientDNAResultBreakdown_masterSNPId_fkey" FOREIGN KEY ("masterSNPId") REFERENCES "MasterSNP"("id") ON DELETE CASCADE ON UPDATE CASCADE;
