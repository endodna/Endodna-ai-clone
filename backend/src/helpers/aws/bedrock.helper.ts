import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import { logger } from "../logger.helper";
import aws from "../../lib/aws";
import { MODEL_ID } from "../token-usage.helper";
import { RequestType, TaskType } from "@prisma/client";
import tokenUsageHelper from "../token-usage.helper";

export interface GenerateEmbeddingParams {
    text: string;
    organizationId: number;
    patientId?: string;
    doctorId?: string;
    taskId?: number;
    taskType: TaskType;
    cacheKey?: string;
    traceId?: string;
}

export interface EmbeddingResult {
    embedding: number[];
    inputTokens: number;
    cacheHit: boolean;
    latencyMs: number;
}

class BedrockHelper {
    private bedrockClient: BedrockRuntimeClient | null = null;
    private enableBedrock: boolean = true;

    private initializeBedrock(): void {
        try {
            this.bedrockClient = new BedrockRuntimeClient({
                region: aws.getRegion(),
                maxAttempts: 3,
            });

            logger.info("AWS Bedrock Client initialized", {
                region: aws.getRegion(),
                method: "BedrockHelper.initializeBedrock",
            });
        } catch (error) {
            logger.error("Failed to initialize AWS Bedrock Client", {
                error: error,
                region: aws.getRegion(),
            });
        }
    }

    private getBedrockClient(): BedrockRuntimeClient {
        if (!this.bedrockClient) {
            this.initializeBedrock();
            if (!this.bedrockClient) {
                throw new Error("Bedrock client failed to initialize");
            }
        }
        return this.bedrockClient;
    }

    async generateEmbedding(
        params: GenerateEmbeddingParams,
    ): Promise<EmbeddingResult> {
        const startTime = Date.now();
        const { text, organizationId, patientId, doctorId, taskId, taskType, traceId } = params

        if (!this.enableBedrock) {
            logger.debug("Bedrock embeddings disabled, returning mock embedding", {
                traceId,
                organizationId,
                patientId,
                taskId,
                taskType,
                textLength: text.length,
            });

            const mockEmbedding = new Array(1536).fill(0).map(() => Math.random() - 0.5);
            const inputTokens = this.estimateTokens(text);
            const latencyMs = Date.now() - startTime;

            await tokenUsageHelper.recordUsage({
                organizationId,
                patientId,
                doctorId,
                taskId,
                taskType,
                requestType: "EMBEDDING",
                modelId: MODEL_ID.TEXT_EMBEDDING,
                modelType: "embedding",
                inputTokens,
                outputTokens: 0,
                cacheHit: false,
                latencyMs,
                metadata: { mock: true },
                traceId,
            });

            return {
                embedding: mockEmbedding,
                inputTokens,
                cacheHit: false,
                latencyMs,
            };
        }

        try {
            logger.debug("Generating embedding", {
                traceId,
                organizationId,
                patientId,
                taskId,
                taskType,
                textLength: text.length,
            });

            const bedrockClient = this.getBedrockClient();
            const modelId = MODEL_ID.TEXT_EMBEDDING;

            const requestBody = {
                inputText: text,
            };

            const command = new InvokeModelCommand({
                modelId,
                contentType: "application/json",
                accept: "application/json",
                body: JSON.stringify(requestBody),
            });

            const response = await bedrockClient.send(command);

            if (!response.body) {
                throw new Error("Empty response body from Bedrock");
            }

            const bodyArray = new Uint8Array(response.body as unknown as ArrayBuffer);
            const responseBody = JSON.parse(
                new TextDecoder().decode(bodyArray),
            );

            if (!responseBody.embedding || !Array.isArray(responseBody.embedding)) {
                throw new Error("Invalid embedding response from Bedrock");
            }

            const embedding = responseBody.embedding as number[];
            const latencyMs = Date.now() - startTime;

            const inputTokens = this.estimateTokens(text);
            const outputTokens = 0;

            await tokenUsageHelper.recordUsage({
                organizationId,
                patientId,
                doctorId,
                taskId,
                taskType,
                requestType: "EMBEDDING",
                modelId,
                modelType: "embedding",
                inputTokens,
                outputTokens,
                cacheHit: false,
                latencyMs,
                traceId,
            });

            logger.info("Embedding generated successfully", {
                traceId,
                organizationId,
                patientId,
                taskId,
                embeddingLength: embedding.length,
                inputTokens,
                latencyMs,
                method: "BedrockHelper.generateEmbedding",
            });

            return {
                embedding,
                inputTokens,
                cacheHit: false,
                latencyMs,
            };
        } catch (error) {
            const latencyMs = Date.now() - startTime;
            logger.error("Error generating embedding", {
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

    async generateEmbeddingsBatch(
        texts: string[],
        params: {
            organizationId: number;
            patientId?: string;
            taskId?: number;
            taskType: TaskType;
            traceId?: string;
        },
    ): Promise<EmbeddingResult[]> {
        const results: EmbeddingResult[] = [];

        for (let i = 0; i < texts.length; i++) {
            const result = await this.generateEmbedding({
                text: texts[i],
                organizationId: params.organizationId,
                patientId: params.patientId,
                taskId: params.taskId,
                taskType: params.taskType,
                traceId: params.traceId,
            });
            results.push(result);

            if (i < texts.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }

        return results;
    }

    async generateText(
        params: {
            systemPrompt: string;
            userPrompt: string;
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
        inputTokens: number;
        outputTokens: number;
        latencyMs: number;
    }> {
        const startTime = Date.now();
        const {
            systemPrompt,
            userPrompt,
            organizationId,
            patientId,
            doctorId,
            taskId,
            taskType,
            maxTokens = 4096,
            temperature = 0.1,
            traceId,
        } = params;

        if (!this.enableBedrock) {
            logger.debug("Bedrock text generation disabled, returning mock text", {
                traceId,
                organizationId,
                patientId,
                taskId,
                taskType,
            });

            const mockText = "This is a mock AI-generated summary. Bedrock is disabled in development mode.";
            const inputTokens = this.estimateTokens(systemPrompt + userPrompt);
            const outputTokens = this.estimateTokens(mockText);
            const latencyMs = Date.now() - startTime;

            await tokenUsageHelper.recordUsage({
                organizationId,
                patientId,
                doctorId,
                taskId,
                taskType,
                requestType: "TEXT_GENERATION",
                modelId: MODEL_ID.CHAT_COMPLETION,
                modelType: "text-generation",
                inputTokens,
                outputTokens,
                cacheHit: false,
                latencyMs,
                metadata: { mock: true },
                traceId,
            });

            return {
                text: mockText,
                inputTokens,
                outputTokens,
                latencyMs,
            };
        }

        try {
            logger.debug("Generating text with Bedrock", {
                traceId,
                organizationId,
                patientId,
                taskId,
                taskType,
                systemPromptLength: systemPrompt.length,
                userPromptLength: userPrompt.length,
            });

            const bedrockClient = this.getBedrockClient();
            const modelId = MODEL_ID.CHAT_COMPLETION;

            const requestBody = {
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: maxTokens,
                temperature,
                system: systemPrompt,
                messages: [
                    {
                        role: "user",
                        content: userPrompt,
                    },
                ],
            };

            const command = new InvokeModelCommand({
                modelId,
                contentType: "application/json",
                accept: "application/json",
                body: JSON.stringify(requestBody),
            });

            const response = await bedrockClient.send(command);

            if (!response.body) {
                throw new Error("Empty response body from Bedrock");
            }

            const bodyArray = new Uint8Array(response.body as unknown as ArrayBuffer);
            const responseBody = JSON.parse(
                new TextDecoder().decode(bodyArray),
            );

            if (!responseBody.content || !Array.isArray(responseBody.content)) {
                throw new Error("Invalid text generation response from Bedrock");
            }

            const text = responseBody.content
                .map((item: any) => item.text)
                .join("");

            const inputTokens = responseBody.usage?.input_tokens || this.estimateTokens(systemPrompt + userPrompt);
            const outputTokens = responseBody.usage?.output_tokens || this.estimateTokens(text);
            const latencyMs = Date.now() - startTime;

            await tokenUsageHelper.recordUsage({
                organizationId,
                patientId,
                doctorId,
                taskId,
                taskType,
                requestType: "TEXT_GENERATION",
                modelId,
                modelType: "text-generation",
                inputTokens,
                outputTokens,
                cacheHit: false,
                latencyMs,
                traceId,
            });

            logger.info("Text generated successfully", {
                traceId,
                organizationId,
                patientId,
                taskId,
                textLength: text.length,
                inputTokens,
                outputTokens,
                latencyMs,
                method: "BedrockHelper.generateText",
            });

            return {
                text,
                inputTokens,
                outputTokens,
                latencyMs,
            };
        } catch (error) {
            const latencyMs = Date.now() - startTime;
            logger.error("Error generating text", {
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

        if (!this.enableBedrock) {
            logger.debug("Bedrock chat completion disabled, returning mock response", {
                traceId,
                organizationId,
                patientId,
                taskId,
                taskType,
            });

            const mockText = "This is a mock AI chat response. Bedrock is disabled in development mode.";
            const messagesContent = messages.map(m => {
                if (typeof m.content === "string") {
                    return m.content;
                } else {
                    return JSON.stringify(m.content);
                }
            }).join(" ");
            const inputTokens = this.estimateTokens(systemPrompt + messagesContent);
            const outputTokens = this.estimateTokens(mockText);
            const latencyMs = Date.now() - startTime;

            await tokenUsageHelper.recordUsage({
                organizationId,
                patientId,
                doctorId,
                taskId,
                taskType,
                requestType: RequestType.CHAT_COMPLETION,
                modelId: MODEL_ID.CHAT_COMPLETION,
                modelType: "chat-completion",
                inputTokens,
                outputTokens,
                cacheHit: false,
                latencyMs,
                metadata: { mock: true, tools: tools?.length || 0 },
                traceId,
            });

            return {
                text: mockText,
                inputTokens,
                outputTokens,
                latencyMs,
            };
        }

        try {
            logger.debug("Generating chat completion with Bedrock", {
                traceId,
                organizationId,
                patientId,
                taskId,
                taskType,
                systemPromptLength: systemPrompt.length,
                messagesCount: messages.length,
                toolsCount: tools?.length || 0,
            });

            const bedrockClient = this.getBedrockClient();
            const modelId = MODEL_ID.CHAT_COMPLETION;

            const requestBody: any = {
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: maxTokens,
                temperature,
                system: systemPrompt,
                messages: messages.map(msg => {
                    if (typeof msg.content === "string") {
                        return {
                            role: msg.role,
                            content: msg.content,
                        };
                    } else {
                        return {
                            role: msg.role,
                            content: msg.content,
                        };
                    }
                }),
            };

            if (tools && tools.length > 0) {
                requestBody.tools = tools;
            }

            const command = new InvokeModelCommand({
                modelId,
                contentType: "application/json",
                accept: "application/json",
                body: JSON.stringify(requestBody),
            });

            const response = await bedrockClient.send(command);

            if (!response.body) {
                throw new Error("Empty response body from Bedrock");
            }

            const bodyArray = new Uint8Array(response.body as unknown as ArrayBuffer);
            const responseBody = JSON.parse(
                new TextDecoder().decode(bodyArray),
            );

            if (!responseBody.content || !Array.isArray(responseBody.content)) {
                throw new Error("Invalid chat completion response from Bedrock");
            }

            const toolCalls: Array<{ id: string; name: string; input: any }> = [];
            let text = "";
            let thinking = "";

            for (const item of responseBody.content) {
                if (item.type === "text") {
                    text += item.text;
                } else if (item.type === "thinking") {
                    thinking += item.text || "";
                } else if (item.type === "tool_use") {
                    toolCalls.push({
                        id: item.id,
                        name: item.name,
                        input: item.input,
                    });
                }
            }

            const messagesContent = messages.map(m => {
                if (typeof m.content === "string") {
                    return m.content;
                } else {
                    return JSON.stringify(m.content);
                }
            }).join(" ");

            const inputTokens = responseBody.usage?.input_tokens || this.estimateTokens(systemPrompt + messagesContent);
            const outputTokens = responseBody.usage?.output_tokens || this.estimateTokens(text);
            const latencyMs = Date.now() - startTime;

            await tokenUsageHelper.recordUsage({
                organizationId,
                patientId,
                doctorId,
                taskId,
                taskType,
                requestType: RequestType.CHAT_COMPLETION,
                modelId,
                modelType: "chat-completion",
                inputTokens,
                outputTokens,
                cacheHit: false,
                latencyMs,
                metadata: {
                    tools: tools?.length || 0,
                    toolCalls: toolCalls.length,
                    toolCallsUsed: toolCalls.map(tc => tc.name),
                    thinking: thinking.length > 0,
                },
                traceId,
            });

            logger.info("Chat completion generated successfully", {
                traceId,
                organizationId,
                patientId,
                taskId,
                textLength: text.length,
                toolCallsCount: toolCalls.length,
                inputTokens,
                outputTokens,
                latencyMs,
                method: "BedrockHelper.generateChatCompletion",
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
            logger.error("Error generating chat completion", {
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

        if (!this.enableBedrock) {
            const mockText = "This is a mock AI chat response. Bedrock is disabled in development mode.";
            for (const char of mockText) {
                yield { type: "text", content: char };
                await new Promise((r) => setTimeout(r, 5));
            }
            const latencyMs = Date.now() - startTime;
            yield { type: "done", inputTokens: mockText.length / 4, outputTokens: mockText.length / 4, latencyMs };
            return;
        }

        try {
            const bedrockClient = this.getBedrockClient();
            const modelId = MODEL_ID.CHAT_COMPLETION;

            const requestBody: any = {
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: maxTokens,
                temperature,
                system: systemPrompt,
                messages: messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                })),
            };

            if (tools && tools.length > 0) {
                requestBody.tools = tools;
            }

            const command = new InvokeModelWithResponseStreamCommand({
                modelId,
                contentType: "application/json",
                accept: "application/json",
                body: JSON.stringify(requestBody),
            });

            const response = await bedrockClient.send(command);

            if (!response.body) {
                throw new Error("Empty response body from Bedrock");
            }

            let fullText = "";
            let inputTokens = 0;
            let outputTokens = 0;
            let buffer = "";
            const pendingTools: Record<string, { id: string; name: string; inputJson: string }> = {};

            for await (const event of response.body) {
                if (!event?.chunk?.bytes) continue;
                const decoded = new TextDecoder().decode(event.chunk.bytes);
                buffer += decoded;

                let chunk: any;
                try {
                    chunk = JSON.parse(buffer.trim());
                    buffer = "";
                } catch {
                    continue;
                }

                if (chunk.type === "message_start") {
                    continue;
                }

                if (chunk.type === "content_block_start" && chunk.content_block?.type === "tool_use") {
                    // Ensure unique tool_use id; if duplicate, skip to avoid API error
                    if (!pendingTools[chunk.content_block.id]) {
                        pendingTools[chunk.content_block.id] = {
                            id: chunk.content_block.id,
                            name: chunk.content_block.name,
                            inputJson: "",
                        };
                        yield {
                            type: "tool_call",
                            toolCall: { id: chunk.content_block.id, name: chunk.content_block.name, input: {} },
                        };
                    }
                }

                if (chunk.type === "content_block_delta") {
                    if (chunk.delta?.type === "text_delta" && chunk.delta?.text) {
                        fullText += chunk.delta.text;
                        yield { type: "text", content: chunk.delta.text };
                    } else if (chunk.delta?.type === "input_json_delta" && typeof chunk.delta.partial_json === "string") {
                        // Accumulate tool input JSON
                        Object.values(pendingTools).forEach((tool) => {
                            tool.inputJson += chunk.delta.partial_json;
                        });
                    }
                }

                if (chunk.type === "message_delta" && chunk.usage) {
                    inputTokens = chunk.usage.input_tokens || inputTokens;
                    outputTokens = chunk.usage.output_tokens || outputTokens;
                }

                if (chunk.type === "message_stop") {
                    // Emit final tool_call inputs if any
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
                                        input: tool.inputJson,
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
                        modelId,
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
            logger.error("Error generating streaming chat completion", {
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

export const bedrockHelper = new BedrockHelper();
export default bedrockHelper;

