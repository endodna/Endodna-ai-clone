-- CreateTable
CREATE TABLE "GeneralChatConversation" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "type" "ChatType" NOT NULL DEFAULT 'GENERAL',
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneralChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneralChatMessage" (
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

    CONSTRAINT "GeneralChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneralChatConversation_doctorId_organizationId_idx" ON "GeneralChatConversation"("doctorId", "organizationId");

-- CreateIndex
CREATE INDEX "GeneralChatMessage_conversationId_createdAt_idx" ON "GeneralChatMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "GeneralChatMessage_conversationId_version_idx" ON "GeneralChatMessage"("conversationId", "version");

-- AddForeignKey
ALTER TABLE "GeneralChatConversation" ADD CONSTRAINT "GeneralChatConversation_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralChatConversation" ADD CONSTRAINT "GeneralChatConversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralChatMessage" ADD CONSTRAINT "GeneralChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "GeneralChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
