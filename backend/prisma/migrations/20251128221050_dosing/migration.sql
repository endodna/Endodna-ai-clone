-- AlterTable
ALTER TABLE "PatientInfo" ADD COLUMN     "clinicalData" JSONB,
ADD COLUMN     "lifestyleData" JSONB,
ADD COLUMN     "medicationsData" JSONB;
