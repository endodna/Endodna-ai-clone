/*
  Warnings:

  - You are about to drop the `PatientChatConversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PatientChatMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PatientChatConversation" DROP CONSTRAINT "PatientChatConversation_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "PatientChatConversation" DROP CONSTRAINT "PatientChatConversation_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "PatientChatConversation" DROP CONSTRAINT "PatientChatConversation_patientId_fkey";

-- DropForeignKey
ALTER TABLE "PatientChatMessage" DROP CONSTRAINT "PatientChatMessage_conversationId_fkey";

-- DropTable
DROP TABLE "PatientChatConversation";

-- DropTable
DROP TABLE "PatientChatMessage";

-- CreateTable
CREATE TABLE "patient_chat_conversations" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "type" "ChatType" NOT NULL DEFAULT 'GENERAL',
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_chat_messages" (
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

    CONSTRAINT "patient_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_chart_notes" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_chart_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_chat_conversations_patientId_organizationId_idx" ON "patient_chat_conversations"("patientId", "organizationId");

-- CreateIndex
CREATE INDEX "patient_chat_conversations_doctorId_organizationId_idx" ON "patient_chat_conversations"("doctorId", "organizationId");

-- CreateIndex
CREATE INDEX "patient_chat_conversations_patientId_doctorId_organizationI_idx" ON "patient_chat_conversations"("patientId", "doctorId", "organizationId");

-- CreateIndex
CREATE INDEX "patient_chat_messages_conversationId_createdAt_idx" ON "patient_chat_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "patient_chat_messages_conversationId_version_idx" ON "patient_chat_messages"("conversationId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "patient_chart_notes_id_key" ON "patient_chart_notes"("id");

-- CreateIndex
CREATE INDEX "patient_chart_notes_patientId_organizationId_idx" ON "patient_chart_notes"("patientId", "organizationId");

-- CreateIndex
CREATE INDEX "patient_chart_notes_doctorId_organizationId_idx" ON "patient_chart_notes"("doctorId", "organizationId");

-- CreateIndex
CREATE INDEX "patient_chart_notes_patientId_doctorId_organizationId_idx" ON "patient_chart_notes"("patientId", "doctorId", "organizationId");

-- CreateIndex
CREATE INDEX "patient_chart_notes_createdAt_idx" ON "patient_chart_notes"("createdAt");

-- AddForeignKey
ALTER TABLE "patient_chat_conversations" ADD CONSTRAINT "patient_chat_conversations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_chat_conversations" ADD CONSTRAINT "patient_chat_conversations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_chat_conversations" ADD CONSTRAINT "patient_chat_conversations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_chat_messages" ADD CONSTRAINT "patient_chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "patient_chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_chart_notes" ADD CONSTRAINT "patient_chart_notes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_chart_notes" ADD CONSTRAINT "patient_chart_notes_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_chart_notes" ADD CONSTRAINT "patient_chart_notes_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
