-- Enable pgvector extension
-- This must be done before using the vector type
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "PatientMedicalRecordChunk" (
    "id" SERIAL NOT NULL,
    "patientMedicalRecordId" INTEGER NOT NULL,
    "chunkText" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "embedding" vector(1536),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientMedicalRecordChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientMedicalRecordChunk_id_key" ON "PatientMedicalRecordChunk"("id");

-- CreateIndex
CREATE INDEX "PatientMedicalRecordChunk_patientMedicalRecordId_idx" ON "PatientMedicalRecordChunk"("patientMedicalRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientMedicalRecordChunk_patientMedicalRecordId_chunkIndex_key" ON "PatientMedicalRecordChunk"("patientMedicalRecordId", "chunkIndex");

-- CreateIndex
CREATE INDEX "PatientMedicalRecord_patientId_organizationId_idx" ON "PatientMedicalRecord"("patientId", "organizationId");

-- AddForeignKey
ALTER TABLE "PatientMedicalRecordChunk" ADD CONSTRAINT "PatientMedicalRecordChunk_patientMedicalRecordId_fkey" FOREIGN KEY ("patientMedicalRecordId") REFERENCES "PatientMedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index on embedding column for faster similarity search
-- Using IVFFlat index for cosine similarity (recommended for pgvector)
CREATE INDEX IF NOT EXISTS patient_medical_record_chunk_embedding_idx
ON "PatientMedicalRecordChunk"
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
