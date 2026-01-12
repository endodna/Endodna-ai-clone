import bedrockHelper from "../aws/bedrock.helper";
import claudeHelper from "./claude.helper";
import { TaskType } from "@prisma/client";

class LLMProviderHelper {
    private useClaudeForChat(): boolean {
        const flag = process.env.USE_CLAUDE_FOR_CHAT;
        return flag === undefined || flag === "" || flag.toLowerCase() === "true";
    }

    async generateChatCompletion(
        params: {
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
            patientId?: string;
            doctorId?: string;
            taskId?: number;
            taskType: TaskType;
            maxTokens?: number;
            temperature?: number;
            traceId?: string;
        },
    ): Promise<{
        text: string;
        thinking?: string;
        inputTokens: number;
        outputTokens: number;
        latencyMs: number;
        toolCalls?: Array<{
            id: string;
            name: string;
            input: any;
        }>;
    }> {
        if (this.useClaudeForChat()) {
            return await claudeHelper.generateChatCompletion(params);
        } else {
            return await bedrockHelper.generateChatCompletion(params);
        }
    }

    async *generateChatCompletionStream(
        params: {
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
            patientId?: string;
            doctorId?: string;
            taskId?: number;
            taskType: TaskType;
            maxTokens?: number;
            temperature?: number;
            traceId?: string;
        },
    ): AsyncGenerator<{
        type: "text" | "done" | "error" | "tool_call";
        content?: string;
        toolCall?: { id: string; name: string; input: any };
        inputTokens?: number;
        outputTokens?: number;
        latencyMs?: number;
        error?: string;
    }> {
        if (this.useClaudeForChat()) {
            yield* claudeHelper.generateChatCompletionStream(params);
        } else {
            yield* bedrockHelper.generateChatCompletionStream(params);
        }
    }
}

export const llmProviderHelper = new LLMProviderHelper();
export default llmProviderHelper;

