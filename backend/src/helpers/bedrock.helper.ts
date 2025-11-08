import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { logger } from "./logger.helper";
import aws from "../lib/aws";
import { MODEL_ID } from "./token-usage.helper";
import { TaskType } from "@prisma/client";
import tokenUsageHelper from "./token-usage.helper";

export interface GenerateEmbeddingParams {
    text: string;
    organizationId: number;
    patientId?: string;
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
        const { text, organizationId, patientId, taskId, taskType, traceId } = params

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

    private estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }
}

export const bedrockHelper = new BedrockHelper();
export default bedrockHelper;

