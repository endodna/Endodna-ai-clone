import Anthropic from "@anthropic-ai/sdk";
import { logger } from "../logger.helper";
import { RequestType, TaskType } from "@prisma/client";
import tokenUsageHelper, { MODEL_ID } from "../token-usage.helper";

class ClaudeHelper {
    private anthropicClient: Anthropic | null = null;
    private readonly claudeModel: string = MODEL_ID.CLAUDE_CHAT_COMPLETION;

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (apiKey) {
            this.anthropicClient = new Anthropic({
                apiKey: apiKey,
            });

            logger.info("Anthropic Claude Client initialized", {
                model: this.claudeModel,
                method: "ClaudeHelper.constructor",
            });
        } else {
            logger.warn("ANTHROPIC_API_KEY not found, Claude client not initialized", {
                method: "ClaudeHelper.constructor",
            });
        }
    }

    private getAnthropicClient(): Anthropic {
        if (!this.anthropicClient) {
            throw new Error("Anthropic client not initialized. ANTHROPIC_API_KEY is required.");
        }
        return this.anthropicClient;
    }

    private convertMessagesToAnthropicFormat(
        messages: Array<{ role: string; content: string | any[] }>,
    ): Anthropic.MessageParam[] {
        const anthropicMessages: Anthropic.MessageParam[] = [];

        for (const msg of messages) {
            if (typeof msg.content === "string") {
                anthropicMessages.push({
                    role: msg.role === "user" ? "user" : "assistant",
                    content: msg.content,
                });
            } else if (Array.isArray(msg.content)) {
                // Handle array content (mixed text, tool_use, and tool_result)
                const content: Anthropic.ContentBlockParam[] = [];
                const toolResults: Anthropic.ToolResultBlockParam[] = [];

                for (const item of msg.content) {
                    if (item.type === "text" && item.text) {
                        content.push({
                            type: "text",
                            text: item.text,
                        });
                    } else if (item.type === "tool_use") {
                        content.push({
                            type: "tool_use",
                            id: item.id,
                            name: item.name,
                            input: item.input,
                        });
                    } else if (item.type === "tool_result") {
                        toolResults.push({
                            type: "tool_result",
                            tool_use_id: item.tool_use_id || item.id,
                            content: typeof item.content === "string" ? item.content : JSON.stringify(item.content),
                            is_error: item.is_error || false,
                        });
                    }
                }

                // If this is a user message with tool results, combine them
                if (msg.role === "user" && toolResults.length > 0) {
                    anthropicMessages.push({
                        role: "user",
                        content: [...content, ...toolResults],
                    });
                } else if (content.length > 0) {
                    // Assistant message with text and/or tool_use
                    anthropicMessages.push({
                        role: msg.role === "user" ? "user" : "assistant",
                        content: content.length > 0 ? content : [{ type: "text", text: "" }],
                    });
                }
            }
        }

        return anthropicMessages;
    }

    private convertToolsToAnthropicFormat(
        tools?: Array<{
            name: string;
            description: string;
            input_schema: {
                type: string;
                properties: Record<string, any>;
                required?: string[];
            };
        }>,
    ): Anthropic.Tool[] | undefined {
        if (!tools || tools.length === 0) {
            return undefined;
        }

        return tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.input_schema as Anthropic.Tool.InputSchema,
        }));
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
        const startTime = Date.now();
        const {
            systemPrompt,
            messages,
            tools,
            organizationId,
            patientId,
            doctorId,
            taskId,
            taskType,
            maxTokens = 2048,
            temperature = 0.5,
            traceId,
        } = params;

        try {
            logger.debug("Generating chat completion with Claude", {
                traceId,
                organizationId,
                patientId,
                taskId,
                taskType,
                systemPromptLength: systemPrompt.length,
                messagesCount: messages.length,
                toolsCount: tools?.length || 0,
                model: this.claudeModel,
            });

            const anthropicClient = this.getAnthropicClient();
            const anthropicMessages = this.convertMessagesToAnthropicFormat(messages);
            const anthropicTools = this.convertToolsToAnthropicFormat(tools);

            const response = await anthropicClient.messages.create({
                model: this.claudeModel,
                max_tokens: maxTokens,
                temperature,
                system: systemPrompt,
                messages: anthropicMessages,
                tools: anthropicTools,
            });

            const toolCalls: Array<{ id: string; name: string; input: any }> = [];
            let text = "";
            let thinking = "";

            for (const contentBlock of response.content) {
                if (contentBlock.type === "text") {
                    text += contentBlock.text;
                } else if (contentBlock.type === "tool_use") {
                    toolCalls.push({
                        id: contentBlock.id,
                        name: contentBlock.name,
                        input: contentBlock.input,
                    });
                }
            }

            // Extract thinking if available (Claude 3.5 Sonnet supports thinking)
            if ("thinking" in response && response.thinking && typeof response.thinking === "string") {
                thinking = response.thinking;
            }

            const inputTokens = response.usage.input_tokens;
            const outputTokens = response.usage.output_tokens;
            const latencyMs = Date.now() - startTime;

            await tokenUsageHelper.recordUsage({
                organizationId,
                patientId,
                doctorId,
                taskId,
                taskType,
                requestType: RequestType.CHAT_COMPLETION,
                modelId: this.claudeModel,
                modelType: "chat-completion",
                inputTokens,
                outputTokens,
                cacheHit: false,
                latencyMs,
                metadata: {
                    tools: tools?.length || 0,
                    toolCalls: toolCalls.length,
                    toolCallsUsed: toolCalls.map((tc) => tc.name),
                    thinking: thinking.length > 0,
                },
                traceId,
            });

            logger.info("Chat completion generated successfully with Claude", {
                traceId,
                organizationId,
                patientId,
                taskId,
                textLength: text.length,
                toolCallsCount: toolCalls.length,
                inputTokens,
                outputTokens,
                latencyMs,
                method: "ClaudeHelper.generateChatCompletion",
            });

            return {
                text,
                inputTokens,
                outputTokens,
                latencyMs,
                toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                thinking: thinking.length > 0 ? thinking : undefined,
            };
        } catch (error) {
            const latencyMs = Date.now() - startTime;
            logger.error("Error generating chat completion with Claude", {
                traceId,
                organizationId,
                patientId,
                taskId,
                error: error,
                latencyMs,
            });
            throw error;
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
        const startTime = Date.now();
        const {
            systemPrompt,
            messages,
            tools,
            organizationId,
            patientId,
            doctorId,
            taskId,
            taskType,
            maxTokens = 2048,
            temperature = 0.5,
            traceId,
        } = params;

        try {
            const anthropicClient = this.getAnthropicClient();
            const anthropicMessages = this.convertMessagesToAnthropicFormat(messages);
            const anthropicTools = this.convertToolsToAnthropicFormat(tools);

            const stream = await anthropicClient.messages.stream({
                model: this.claudeModel,
                max_tokens: maxTokens,
                temperature,
                system: systemPrompt,
                messages: anthropicMessages,
                tools: anthropicTools,
            });

            let fullText = "";
            let inputTokens = 0;
            let outputTokens = 0;
            const pendingTools: Record<string, { id: string; name: string; inputJson: string }> = {};
            let currentToolId: string | null = null;

            for await (const event of stream) {
                if (event.type === "message_start") {
                    continue;
                }

                if (event.type === "content_block_start") {
                    if (event.content_block.type === "tool_use") {
                        const toolBlock = event.content_block;
                        currentToolId = toolBlock.id;
                        if (!pendingTools[toolBlock.id]) {
                            pendingTools[toolBlock.id] = {
                                id: toolBlock.id,
                                name: toolBlock.name,
                                inputJson: "",
                            };
                            yield {
                                type: "tool_call",
                                toolCall: {
                                    id: toolBlock.id,
                                    name: toolBlock.name,
                                    input: {},
                                },
                            };
                        }
                    }
                }

                if (event.type === "content_block_delta") {
                    if (event.delta.type === "text_delta" && event.delta.text) {
                        fullText += event.delta.text;
                        yield { type: "text", content: event.delta.text };
                    } else if (event.delta.type === "input_json_delta" && event.delta.partial_json) {
                        // Accumulate tool input JSON for the current tool
                        if (currentToolId && pendingTools[currentToolId]) {
                            pendingTools[currentToolId].inputJson += event.delta.partial_json;
                        }
                    }
                }

                if (event.type === "content_block_stop") {
                    // When a content block stops, emit the complete tool call if it's a tool_use
                    if (currentToolId && pendingTools[currentToolId]) {
                        const tool = pendingTools[currentToolId];
                        if (tool.inputJson.trim().length > 0) {
                            try {
                                yield {
                                    type: "tool_call",
                                    toolCall: {
                                        id: tool.id,
                                        name: tool.name,
                                        input: JSON.parse(tool.inputJson),
                                    },
                                };
                            } catch {
                                // If JSON parsing fails, try to use the raw string or empty object
                                try {
                                    yield {
                                        type: "tool_call",
                                        toolCall: {
                                            id: tool.id,
                                            name: tool.name,
                                            input: tool.inputJson ? JSON.parse(tool.inputJson) : {},
                                        },
                                    };
                                } catch {
                                    yield {
                                        type: "tool_call",
                                        toolCall: {
                                            id: tool.id,
                                            name: tool.name,
                                            input: {},
                                        },
                                    };
                                }
                            }
                        }
                    }
                    currentToolId = null;
                }

                if (event.type === "message_delta") {
                    if (event.usage) {
                        inputTokens = event.usage.input_tokens || inputTokens;
                        outputTokens = event.usage.output_tokens || outputTokens;
                    }
                }

                if (event.type === "message_stop") {
                    // Emit any remaining tool calls
                    for (const tool of Object.values(pendingTools)) {
                        if (tool.inputJson.trim().length > 0) {
                            try {
                                yield {
                                    type: "tool_call",
                                    toolCall: {
                                        id: tool.id,
                                        name: tool.name,
                                        input: JSON.parse(tool.inputJson),
                                    },
                                };
                            } catch {
                                yield {
                                    type: "tool_call",
                                    toolCall: {
                                        id: tool.id,
                                        name: tool.name,
                                        input: {},
                                    },
                                };
                            }
                        }
                    }

                    const latencyMs = Date.now() - startTime;
                    await tokenUsageHelper.recordUsage({
                        organizationId,
                        patientId,
                        doctorId,
                        taskId,
                        taskType,
                        requestType: RequestType.CHAT_COMPLETION,
                        modelId: this.claudeModel,
                        modelType: "chat-completion",
                        inputTokens: inputTokens || this.estimateTokens(systemPrompt + JSON.stringify(messages)),
                        outputTokens: outputTokens || this.estimateTokens(fullText),
                        cacheHit: false,
                        latencyMs,
                        metadata: {
                            tools: tools?.length || 0,
                            streamed: true,
                        },
                        traceId,
                    });

                    yield {
                        type: "done",
                        inputTokens,
                        outputTokens,
                        latencyMs,
                    };
                    return;
                }
            }
        } catch (error: any) {
            const latencyMs = Date.now() - startTime;
            logger.error("Error generating streaming chat completion with Claude", {
                traceId,
                organizationId,
                patientId,
                taskId,
                error,
                latencyMs,
            });
            yield { type: "error", error: error?.message || "Streaming error", latencyMs };
        }
    }

    private estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }
}

export const claudeHelper = new ClaudeHelper();
export default claudeHelper;

