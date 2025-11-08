-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('MEDICAL_RECORD_PROCESSING', 'PATIENT_SUMMARY_GENERATION', 'DOCUMENT_EMBEDDING', 'SIMILARITY_SEARCH', 'QUESTION_ANSWERING', 'CHART_NOTE_GENERATION', 'TREATMENT_PLAN_GENERATION', 'DIAGNOSIS_ASSISTANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('EMBEDDING', 'TEXT_GENERATION', 'TEXT_EMBEDDING', 'CHAT_COMPLETION');

-- CreateTable
CREATE TABLE "TokenUsage" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "patientId" TEXT,
    "taskId" INTEGER,
    "taskType" "TaskType" NOT NULL,
    "requestType" "RequestType" NOT NULL,
    "modelId" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "inputCost" DECIMAL(10,6) NOT NULL,
    "outputCost" DECIMAL(10,6) NOT NULL,
    "totalCost" DECIMAL(10,6) NOT NULL,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "latencyMs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenUsage_id_key" ON "TokenUsage"("id");

-- CreateIndex
CREATE INDEX "TokenUsage_organizationId_createdAt_idx" ON "TokenUsage"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "TokenUsage_patientId_createdAt_idx" ON "TokenUsage"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "TokenUsage_taskId_taskType_createdAt_idx" ON "TokenUsage"("taskId", "taskType", "createdAt");

-- CreateIndex
CREATE INDEX "TokenUsage_taskType_createdAt_idx" ON "TokenUsage"("taskType", "createdAt");

-- CreateIndex
CREATE INDEX "TokenUsage_requestType_createdAt_idx" ON "TokenUsage"("requestType", "createdAt");

-- CreateIndex
CREATE INDEX "TokenUsage_modelId_createdAt_idx" ON "TokenUsage"("modelId", "createdAt");

-- AddForeignKey
ALTER TABLE "TokenUsage" ADD CONSTRAINT "TokenUsage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenUsage" ADD CONSTRAINT "TokenUsage_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
