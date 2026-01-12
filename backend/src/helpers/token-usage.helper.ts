import { prisma } from "../lib/prisma";
import { logger } from "./logger.helper";
import { Decimal } from "@prisma/client/runtime/library";
import { TaskType, RequestType } from "@prisma/client";

export const MODEL_ID = {
    TEXT_EMBEDDING: "amazon.titan-embed-text-v1",
    CHAT_COMPLETION: "global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    CLAUDE_CHAT_COMPLETION: "claude-sonnet-4-5-20250929",
} as const;

export interface RecordTokenUsageParams {
    organizationId: number;
    patientId?: string;
    doctorId?: string;
    taskId?: number;
    taskType: TaskType;
    requestType: RequestType;
    modelId: string;
    modelType: string;
    inputTokens: number;
    outputTokens: number;
    cacheHit?: boolean;
    latencyMs?: number;
    metadata?: Record<string, any>;
    traceId?: string;
}

export interface TokenUsageStats {
    totalRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalInputCost: number;
    totalOutputCost: number;
    totalCost: number;
    cacheHits: number;
    cacheHitRate: number;
    averageLatencyMs: number;
}

export interface ModelPricing {
    inputCostPerMillionTokens: number;
    outputCostPerMillionTokens: number;
}

class TokenUsageHelper {
    private readonly modelPricing: Record<string, ModelPricing> = {
        [MODEL_ID.TEXT_EMBEDDING]: {
            inputCostPerMillionTokens: 0.1,
            outputCostPerMillionTokens: 0,
        },
        [MODEL_ID.CHAT_COMPLETION]: {
            inputCostPerMillionTokens: 3,
            outputCostPerMillionTokens: 15,
        },
        [MODEL_ID.CLAUDE_CHAT_COMPLETION]: {
            inputCostPerMillionTokens: 3,
            outputCostPerMillionTokens: 15,
        }
    };

    private calculateCost(
        modelId: string,
        inputTokens: number,
        outputTokens: number,
    ): { inputCost: Decimal; outputCost: Decimal; totalCost: Decimal } {
        const pricing = this.modelPricing[modelId];

        if (!pricing) {
            logger.warn(`Pricing not found for model: ${modelId}`, { modelId });
            return {
                inputCost: new Decimal(0),
                outputCost: new Decimal(0),
                totalCost: new Decimal(0),
            };
        }

        const inputCost = new Decimal(inputTokens)
            .div(1_000_000)
            .mul(pricing.inputCostPerMillionTokens);
        const outputCost = new Decimal(outputTokens)
            .div(1_000_000)
            .mul(pricing.outputCostPerMillionTokens);
        const totalCost = inputCost.plus(outputCost);

        return { inputCost, outputCost, totalCost };
    }

    async recordUsage(params: RecordTokenUsageParams): Promise<void> {
        const { inputCost, outputCost, totalCost } = this.calculateCost(
            params.modelId,
            params.inputTokens,
            params.outputTokens,
        );

        try {
            await prisma.tokenUsage.create({
                data: {
                    organizationId: params.organizationId,
                    patientId: params.patientId,
                    doctorId: params.doctorId,
                    taskId: params.taskId,
                    taskType: params.taskType,
                    requestType: params.requestType,
                    modelId: params.modelId,
                    modelType: params.modelType,
                    inputTokens: params.inputTokens,
                    outputTokens: params.outputTokens,
                    totalTokens: params.inputTokens + params.outputTokens,
                    inputCost,
                    outputCost,
                    totalCost,
                    cacheHit: params.cacheHit || false,
                    latencyMs: params.latencyMs,
                    metadata: params.metadata || {},
                },
            });

            logger.debug("Token usage recorded", {
                traceId: params.traceId,
                organizationId: params.organizationId,
                patientId: params.patientId,
                doctorId: params.doctorId,
                taskId: params.taskId,
                taskType: params.taskType,
                modelId: params.modelId,
                totalTokens: params.inputTokens + params.outputTokens,
                totalCost: totalCost.toFixed(6),
            });
        } catch (error) {
            logger.error("Failed to record token usage", {
                traceId: params.traceId,
                organizationId: params.organizationId,
                patientId: params.patientId,
                doctorId: params.doctorId,
                taskId: params.taskId,
                error: error,
            });
            throw error;
        }
    }

    getModelPricing(modelId: string): ModelPricing | null {
        return this.modelPricing[modelId] || null;
    }
}

export const tokenUsageHelper = new TokenUsageHelper();
export default tokenUsageHelper;

