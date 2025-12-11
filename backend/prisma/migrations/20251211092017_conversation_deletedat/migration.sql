-- AlterTable
ALTER TABLE "GeneralChatConversation" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PatientChatConversation" ADD COLUMN     "deletedAt" TIMESTAMP(3);
