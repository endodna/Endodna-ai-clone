import { logger } from "../logger.helper";
import bedrockHelper from "../aws/bedrock.helper";
import { TaskType, ChatMessageRole } from "@prisma/client";

export interface BaseMessage {
    role: ChatMessageRole;
    content: string;
}

export interface TokenCalculationResult {
    systemPromptTokens: number;
    newMessageTokens: number;
    maxOutputTokens: number;
    maxInputTokens: number;
    reservedTokens: number;
    availableTokens: number;
}

export interface BuildMessagesResult {
    messages: Array<{ role: string; content: string }>;
}

export abstract class BaseChatHelper {
    protected readonly MAX_OUTPUT_TOKENS = 2048;
    protected readonly MAX_INPUT_TOKENS = 200000;
    protected readonly TEMPERATURE = 0.5;
    protected readonly TOKEN_OVERHEAD = 10;
    protected readonly RESERVED_TOKENS_BUFFER = 1000;

    protected getOmniBoxIdentityPrompt(): string {
        return `YOUR IDENTITY:
        - Your name is OmniBox
        - When asked about your name or identity, always respond that you are OmniBox
        - You are a medical AI assistant designed to help doctors
        - Do not say you are created by Anthropic or that you don't have a name - you are OmniBox`;
    }

    protected getCommonGuidelinesPrompt(): string {
        return `IMPORTANT GUIDELINES:
        - Provide accurate, evidence-based medical information
        - Always prioritize patient safety
        - Be clear and concise in your responses
        - If you're uncertain about something, say so
        - Do not provide definitive diagnoses - that's the doctor's responsibility
        - Use proper medical terminology when appropriate
        - Format your responses using Markdown for better readability
        - Use line breaks for paragraph separation when needed
        - Adapt your responses based on the conversation context and the doctor's questions`;
    }

    protected getFollowUpQuestionsInstruction(): string {
        return `- At the end of your response, if appropriate, include a "## Suggested Follow-up Questions" section with 2-4 relevant questions that the doctor might want to ask next. Format each question as a bullet point starting with "- ". These questions should help guide further inquiry based on the conversation context`;
    }

    protected estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    protected parseChatResponseWithFollowUps(fullText: string): { content: string; followUpPrompts: string[] } {
        const followUpSectionRegex = /##\s*Suggested\s*Follow-up\s*Questions\s*\n([\s\S]*?)$/i;
        const match = fullText.match(followUpSectionRegex);

        let content = fullText;
        let followUpPrompts: string[] = [];

        if (match) {
            const followUpSection = match[1].trim();
            content = fullText.replace(followUpSectionRegex, '').trim();

            const bulletPointRegex = /^[-*]\s*(.+)$/gm;
            const prompts = [];
            let promptMatch;

            while ((promptMatch = bulletPointRegex.exec(followUpSection)) !== null) {
                prompts.push(promptMatch[1].trim());
            }

            followUpPrompts = prompts.filter(p => p.length > 0);
        }

        return { content, followUpPrompts };
    }

    protected calculateTokens(
        systemPrompt: string,
        message: string,
        maxOutputTokens?: number,
        maxInputTokens?: number,
    ): TokenCalculationResult {
        const outputTokens = maxOutputTokens ?? this.MAX_OUTPUT_TOKENS;
        const inputTokens = maxInputTokens ?? this.MAX_INPUT_TOKENS;
        const systemPromptTokens = this.estimateTokens(systemPrompt);
        const newMessageTokens = this.estimateTokens(message);
        const reservedTokens = systemPromptTokens + newMessageTokens + outputTokens + this.RESERVED_TOKENS_BUFFER;
        const availableTokens = inputTokens - reservedTokens;

        return {
            systemPromptTokens,
            newMessageTokens,
            maxOutputTokens: outputTokens,
            maxInputTokens: inputTokens,
            reservedTokens,
            availableTokens,
        };
    }

    protected buildMessagesFromHistory(
        conversationMessages: BaseMessage[],
        newMessage: string,
        availableTokens: number,
    ): BuildMessagesResult {
        const messages: Array<{ role: string; content: string }> = [];
        let currentTokens = 0;

        const reversedMessages = [...conversationMessages].reverse();

        for (const msg of reversedMessages) {
            if (msg.role === ChatMessageRole.SYSTEM) {
                continue;
            }

            const bedrockRole = msg.role === ChatMessageRole.USER ? "user" : "assistant";
            const messageTokens = this.estimateTokens(msg.content) + this.TOKEN_OVERHEAD;

            if (currentTokens + messageTokens > availableTokens) {
                break;
            }

            const lastRole = messages.length > 0 ? messages[0].role : null;

            if (lastRole === bedrockRole) {
                continue;
            }

            if (msg.content && msg.content.trim().length > 0) {
                messages.unshift({
                    role: bedrockRole,
                    content: msg.content,
                });
            }

            currentTokens += messageTokens;
        }

        const lastMessageRole = messages.length > 0 ? messages[messages.length - 1].role : null;

        if (newMessage && newMessage.trim().length > 0) {
            if (lastMessageRole === "assistant" || messages.length === 0) {
                messages.push({
                    role: "user",
                    content: newMessage,
                });
            } else if (lastMessageRole === "user") {
                messages[messages.length - 1] = {
                    role: "user",
                    content: newMessage,
                };
            }
        }

        return { messages };
    }

    protected filterEmptyMessages(messages: Array<{ role: string; content: string | any[] }>): Array<{ role: string; content: string | any[] }> {
        const filtered: Array<{ role: string; content: string | any[] }> = [];

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const isLastMessage = i === messages.length - 1;
            const isAssistant = msg.role === "assistant";

            let isEmpty = false;
            if (typeof msg.content === "string") {
                isEmpty = !msg.content || msg.content.trim().length === 0;
            } else if (Array.isArray(msg.content)) {
                if (msg.content.length === 0) {
                    isEmpty = true;
                } else {
                    const hasNonEmptyText = msg.content.some((item: any) =>
                        item?.type === "text" && item?.text && item.text.trim().length > 0
                    );
                    const hasToolUse = msg.content.some((item: any) =>
                        item?.type === "tool_use" || item?.type === "tool_result"
                    );
                    isEmpty = !hasNonEmptyText && !hasToolUse;
                }
            } else {
                isEmpty = true;
            }

            if (!isEmpty || (isLastMessage && isAssistant)) {
                filtered.push(msg);
            }
        }

        return filtered;
    }
    protected async generateAIResponse(params: {
        systemPrompt: string;
        messages: Array<{ role: string; content: string | any[] }>;
        tools?: Array<{
            name: string;
            description: string;
            input_schema: {
                type: string;
                properties: Record<string, any>;
                required?: string[];
            };
        }>;
        organizationId: number;
        doctorId: string;
        patientId?: string;
        taskType: TaskType;
        maxTokens: number;
        temperature: number;
        traceId?: string;
    }) {
        const filteredMessages = this.filterEmptyMessages(params.messages);

        return await bedrockHelper.generateChatCompletion({
            systemPrompt: params.systemPrompt,
            messages: filteredMessages as any,
            tools: params.tools,
            organizationId: params.organizationId,
            doctorId: params.doctorId,
            patientId: params.patientId,
            taskType: params.taskType,
            maxTokens: params.maxTokens ?? this.MAX_OUTPUT_TOKENS,
            temperature: params.temperature ?? this.TEMPERATURE,
            traceId: params.traceId,
        });
    }

    protected logMessageSent(params: {
        traceId?: string;
        conversationId: string;
        doctorId: string;
        organizationId: number;
        patientId?: string;
        messageLength: number;
        responseLength: number;
        inputTokens: number;
        outputTokens: number;
        latencyMs: number;
        method: string;
        toolCallsUsed?: string[];
    }) {
        logger.info("Chat message sent successfully", {
            traceId: params.traceId,
            conversationId: params.conversationId,
            doctorId: params.doctorId,
            organizationId: params.organizationId,
            ...(params.patientId && { patientId: params.patientId }),
            messageLength: params.messageLength,
            responseLength: params.responseLength,
            inputTokens: params.inputTokens,
            outputTokens: params.outputTokens,
            latencyMs: params.latencyMs,
            ...(params.toolCallsUsed && {
                toolCallsUsed: params.toolCallsUsed,
                toolCallsCount: params.toolCallsUsed.length,
            }),
            method: params.method,
        });
    }

    protected logMessageError(params: {
        traceId?: string;
        conversationId: string;
        doctorId: string;
        organizationId: number;
        patientId?: string;
        error: any;
        method: string;
    }) {
        logger.error("Error sending chat message", {
            traceId: params.traceId,
            conversationId: params.conversationId,
            doctorId: params.doctorId,
            organizationId: params.organizationId,
            ...(params.patientId && { patientId: params.patientId }),
            error: params.error,
            method: params.method,
        });
    }
}

