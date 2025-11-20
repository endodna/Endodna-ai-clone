import { prisma } from "../../lib/prisma";
import { TaskType, ChatMessageRole } from "@prisma/client";
import { BaseChatHelper, BaseMessage } from "./base-chat.helper";

export interface SendGeneralMessageParams {
    conversationId: string;
    doctorId: string;
    organizationId: number;
    message: string;
    traceId?: string;
}

export interface SendGeneralMessageResult {
    messageId: string;
    content: string;
    followUpPrompts: string[];
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
}

class GeneralChatHelper extends BaseChatHelper {

    private buildSystemPrompt(): string {
        return `You are OmniBox, an AI medical assistant helping doctors with general medical questions, research, and clinical decision support.

        ${this.getOmniBoxIdentityPrompt()}

        ${this.getCommonGuidelinesPrompt()}
        - Focus on providing helpful context, medical knowledge, and clinical insights
        - Help doctors with medical research, treatment guidelines, drug information, and general medical questions
        - When discussing medications, include relevant information about dosing, contraindications, and interactions
        - When discussing conditions, include relevant information about symptoms, diagnosis, and treatment options
        - Always emphasize the importance of clinical judgment and patient-specific considerations
        ${this.getFollowUpQuestionsInstruction()} and medical topic being discussed`;
    }

    async sendMessage(params: SendGeneralMessageParams): Promise<SendGeneralMessageResult> {
        const {
            conversationId,
            doctorId,
            organizationId,
            message,
            traceId,
        } = params;

        try {
            const conversation = await prisma.generalChatConversation.findFirst({
                where: {
                    id: conversationId,
                    doctorId,
                    organizationId,
                },
                include: {
                    messages: {
                        orderBy: {
                            createdAt: "asc",
                        },
                    },
                },
            });

            if (!conversation) {
                throw new Error("Conversation not found");
            }

            const systemPrompt = this.buildSystemPrompt();
            const tokenCalc = this.calculateTokens(systemPrompt, message);
            const { messages } = this.buildMessagesFromHistory(
                conversation.messages as BaseMessage[],
                message,
                tokenCalc.availableTokens,
            );

            const userMessage = await prisma.generalChatMessage.create({
                data: {
                    conversationId,
                    role: ChatMessageRole.USER,
                    content: message,
                    version: 1,
                },
            });

            const result = await this.generateAIResponse({
                systemPrompt,
                messages,
                organizationId,
                doctorId,
                taskType: TaskType.DIAGNOSIS_ASSISTANCE,
                maxTokens: this.MAX_OUTPUT_TOKENS,
                temperature: this.TEMPERATURE,
                traceId,
            });

            const { content: parsedContent, followUpPrompts } = this.parseChatResponseWithFollowUps(result.text);

            const assistantMessage = await prisma.generalChatMessage.create({
                data: {
                    conversationId,
                    role: ChatMessageRole.ASSISTANT,
                    content: result.text,
                    version: 1,
                    inputTokens: result.inputTokens,
                    outputTokens: result.outputTokens,
                    latencyMs: result.latencyMs,
                    metadata: {
                        followUpPrompts,
                    },
                },
            });

            await prisma.generalChatMessage.update({
                where: { id: userMessage.id },
                data: {
                    inputTokens: result.inputTokens,
                    outputTokens: 0,
                    latencyMs: result.latencyMs,
                },
            });

            await prisma.generalChatConversation.update({
                where: { id: conversationId },
                data: {
                    updatedAt: new Date(),
                },
            });

            this.logMessageSent({
                traceId,
                conversationId,
                doctorId,
                organizationId,
                messageLength: message.length,
                responseLength: result.text.length,
                inputTokens: result.inputTokens,
                outputTokens: result.outputTokens,
                latencyMs: result.latencyMs,
                method: "GeneralChatHelper.sendMessage",
            });

            return {
                messageId: assistantMessage.id,
                content: parsedContent,
                followUpPrompts,
                inputTokens: result.inputTokens,
                outputTokens: result.outputTokens,
                latencyMs: result.latencyMs,
            };
        } catch (error) {
            this.logMessageError({
                traceId,
                conversationId,
                doctorId,
                organizationId,
                error,
                method: "GeneralChatHelper.sendMessage",
            });
            throw error;
        }
    }
}

export const generalChatHelper = new GeneralChatHelper();
export default generalChatHelper;

