-- AlterTable
ALTER TABLE "PatientAllergy" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "severity" TEXT,
ALTER COLUMN "reactionType" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PatientProblemList" ALTER COLUMN "severity" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PatientAlert" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "patientId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientAlert_id_key" ON "PatientAlert"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientAlert_uuid_key" ON "PatientAlert"("uuid");

-- AddForeignKey
ALTER TABLE "PatientAlert" ADD CONSTRAINT "PatientAlert_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAlert" ADD CONSTRAINT "PatientAlert_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
