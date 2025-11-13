/*
  Warnings:

  - You are about to drop the `patient_chart_notes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `patient_chat_conversations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `patient_chat_messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "patient_chart_notes" DROP CONSTRAINT "patient_chart_notes_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "patient_chart_notes" DROP CONSTRAINT "patient_chart_notes_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "patient_chart_notes" DROP CONSTRAINT "patient_chart_notes_patientId_fkey";

-- DropForeignKey
ALTER TABLE "patient_chat_conversations" DROP CONSTRAINT "patient_chat_conversations_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "patient_chat_conversations" DROP CONSTRAINT "patient_chat_conversations_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "patient_chat_conversations" DROP CONSTRAINT "patient_chat_conversations_patientId_fkey";

-- DropForeignKey
ALTER TABLE "patient_chat_messages" DROP CONSTRAINT "patient_chat_messages_conversationId_fkey";

-- DropTable
DROP TABLE "patient_chart_notes";

-- DropTable
DROP TABLE "patient_chat_conversations";

-- DropTable
DROP TABLE "patient_chat_messages";

-- CreateTable
CREATE TABLE "PatientChatConversation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "type" "ChatType" NOT NULL DEFAULT 'GENERAL',
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "ChatMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "latencyMs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientChartNote" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientChartNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PatientChatConversation_patientId_organizationId_idx" ON "PatientChatConversation"("patientId", "organizationId");

-- CreateIndex
CREATE INDEX "PatientChatConversation_doctorId_organizationId_idx" ON "PatientChatConversation"("doctorId", "organizationId");

-- CreateIndex
CREATE INDEX "PatientChatConversation_patientId_doctorId_organizationId_idx" ON "PatientChatConversation"("patientId", "doctorId", "organizationId");

-- CreateIndex
CREATE INDEX "PatientChatMessage_conversationId_createdAt_idx" ON "PatientChatMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "PatientChatMessage_conversationId_version_idx" ON "PatientChatMessage"("conversationId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PatientChartNote_id_key" ON "PatientChartNote"("id");

-- CreateIndex
CREATE INDEX "PatientChartNote_patientId_organizationId_idx" ON "PatientChartNote"("patientId", "organizationId");

-- CreateIndex
CREATE INDEX "PatientChartNote_doctorId_organizationId_idx" ON "PatientChartNote"("doctorId", "organizationId");

-- CreateIndex
CREATE INDEX "PatientChartNote_patientId_doctorId_organizationId_idx" ON "PatientChartNote"("patientId", "doctorId", "organizationId");

-- CreateIndex
CREATE INDEX "PatientChartNote_createdAt_idx" ON "PatientChartNote"("createdAt");

-- AddForeignKey
ALTER TABLE "PatientChatConversation" ADD CONSTRAINT "PatientChatConversation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientChatConversation" ADD CONSTRAINT "PatientChatConversation_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientChatConversation" ADD CONSTRAINT "PatientChatConversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientChatMessage" ADD CONSTRAINT "PatientChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "PatientChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientChartNote" ADD CONSTRAINT "PatientChartNote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientChartNote" ADD CONSTRAINT "PatientChartNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientChartNote" ADD CONSTRAINT "PatientChartNote_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
