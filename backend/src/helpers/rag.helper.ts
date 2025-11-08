import { prisma } from "../lib/prisma";
import { logger } from "./logger.helper";
import bedrockHelper from "./bedrock.helper";
import { TaskType } from "@prisma/client";
import redis from "../lib/redis";

export interface PatientSummaryParams {
    patientId: string;
    organizationId: number;
    traceId?: string;
}

export interface PatientSummaryResult {
    summary: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
}

interface RelevantChunk {
    id: number;
    chunkText: string;
    chunkIndex: number;
    similarity: number | null;
    patientMedicalRecord: {
        id: number;
        title: string | null;
        type: string | null;
        createdAt: Date;
    };
}

class RAGHelper {
    private getPatientSummaryCacheKey(organizationId: number, patientId: string): string {
        return `PATIENT_SUMMARY:${organizationId}:${patientId}`;
    }

    async invalidatePatientSummaryCache(
        organizationId: number,
        patientId: string,
        traceId?: string,
    ): Promise<void> {
        const cacheKey = this.getPatientSummaryCacheKey(organizationId, patientId);

        try {
            const deleted = await redis.del(cacheKey);
            logger.info("Patient summary cache invalidated", {
                traceId,
                patientId,
                organizationId,
                cacheKey,
                deleted,
            });
        } catch (error) {
            logger.error("Error invalidating patient summary cache", {
                traceId,
                patientId,
                organizationId,
                cacheKey,
                error: error,
            });
        }
    }

    private async findRelevantChunks(
        queryEmbedding: number[],
        patientId: string,
        organizationId: number,
        limit: number = 50,
        similarityThreshold: number = 0.7,
        traceId?: string,
    ): Promise<RelevantChunk[]> {
        try {
            const embeddingString = `[${queryEmbedding.join(",")}]`;

            let chunks = await prisma.$queryRawUnsafe<any[]>(`
                SELECT 
                    c.id,
                    c."chunkText",
                    c."chunkIndex",
                    c."patientMedicalRecordId",
                    (1 - (c.embedding <=> $1::vector)) as similarity,
                    r.title,
                    r.type,
                    r."createdAt"
                FROM "PatientMedicalRecordChunk" c
                INNER JOIN "PatientMedicalRecord" r ON c."patientMedicalRecordId" = r.id
                WHERE 
                    r."patientId" = $2
                    AND r."organizationId" = $3
                    AND r."deletedAt" IS NULL
                    AND r."isProcessed" = true
                    AND c.embedding IS NOT NULL
                    AND (1 - (c.embedding <=> $1::vector)) >= $4
                ORDER BY c.embedding <=> $1::vector
                LIMIT $5
            `, embeddingString, patientId, organizationId, similarityThreshold, limit);

            logger.debug("Found relevant chunks using semantic search", {
                traceId,
                patientId,
                organizationId,
                chunksFound: chunks.length,
                similarityThreshold,
            });

            if (chunks.length === 0) {
                logger.warn("No chunks found with similarity threshold, trying lower threshold", {
                    traceId,
                    patientId,
                    organizationId,
                    similarityThreshold,
                });

                chunks = await prisma.$queryRawUnsafe<any[]>(`
                    SELECT 
                        c.id,
                        c."chunkText",
                        c."chunkIndex",
                        c."patientMedicalRecordId",
                        (1 - (c.embedding <=> $1::vector)) as similarity,
                        r.title,
                        r.type,
                        r."createdAt"
                    FROM "PatientMedicalRecordChunk" c
                    INNER JOIN "PatientMedicalRecord" r ON c."patientMedicalRecordId" = r.id
                    WHERE 
                        r."patientId" = $2
                        AND r."organizationId" = $3
                        AND r."deletedAt" IS NULL
                        AND r."isProcessed" = true
                        AND c.embedding IS NOT NULL
                    ORDER BY c.embedding <=> $1::vector
                    LIMIT $4
                `, embeddingString, patientId, organizationId, limit);

                logger.debug("Found chunks with lower threshold", {
                    traceId,
                    patientId,
                    organizationId,
                    chunksFound: chunks.length,
                });
            }

            if (chunks.length === 0) {
                logger.warn("No chunks with embeddings found, falling back to non-embedding chunks", {
                    traceId,
                    patientId,
                    organizationId,
                });

                const fallbackChunks = await prisma.patientMedicalRecordChunk.findMany({
                    where: {
                        patientMedicalRecord: {
                            patientId,
                            organizationId,
                            deletedAt: null,
                            isProcessed: true,
                        },
                    },
                    select: {
                        id: true,
                        chunkText: true,
                        chunkIndex: true,
                        patientMedicalRecord: {
                            select: {
                                id: true,
                                title: true,
                                type: true,
                                createdAt: true,
                            },
                        },
                    },
                    orderBy: [
                        {
                            patientMedicalRecord: {
                                createdAt: "desc",
                            },
                        },
                        {
                            chunkIndex: "asc",
                        },
                    ],
                    take: limit,
                });

                return fallbackChunks.map((chunk: any) => ({
                    id: chunk.id,
                    chunkText: chunk.chunkText,
                    chunkIndex: chunk.chunkIndex,
                    similarity: null,
                    patientMedicalRecord: {
                        id: chunk.patientMedicalRecord.id,
                        title: chunk.patientMedicalRecord.title,
                        type: chunk.patientMedicalRecord.type,
                        createdAt: chunk.patientMedicalRecord.createdAt,
                    },
                }));
            }

            return chunks.map((chunk: any) => ({
                id: chunk.id,
                chunkText: chunk.chunkText,
                chunkIndex: chunk.chunkIndex,
                similarity: parseFloat(chunk.similarity),
                patientMedicalRecord: {
                    id: chunk.patientMedicalRecordId,
                    title: chunk.title,
                    type: chunk.type,
                    createdAt: chunk.createdAt,
                },
            }));
        } catch (error) {
            logger.error("Error finding relevant chunks", {
                traceId,
                patientId,
                organizationId,
                error: error,
            });

            logger.info("Falling back to non-embedding chunks due to error", {
                traceId,
                patientId,
                organizationId,
            });

            const fallbackChunks = await prisma.patientMedicalRecordChunk.findMany({
                where: {
                    patientMedicalRecord: {
                        patientId,
                        organizationId,
                        deletedAt: null,
                        isProcessed: true,
                    },
                },
                select: {
                    id: true,
                    chunkText: true,
                    chunkIndex: true,
                    patientMedicalRecord: {
                        select: {
                            id: true,
                            title: true,
                            type: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: [
                    {
                        patientMedicalRecord: {
                            createdAt: "desc",
                        },
                    },
                    {
                        chunkIndex: "asc",
                    },
                ],
                take: limit,
            });

            return fallbackChunks.map((chunk: any) => ({
                id: chunk.id,
                chunkText: chunk.chunkText,
                chunkIndex: chunk.chunkIndex,
                similarity: null,
                patientMedicalRecord: {
                    id: chunk.patientMedicalRecord.id,
                    title: chunk.patientMedicalRecord.title,
                    type: chunk.patientMedicalRecord.type,
                    createdAt: chunk.patientMedicalRecord.createdAt,
                },
            }));
        }
    }

    private formatMedicalRecordChunks(chunks: RelevantChunk[]): string {
        if (!chunks || chunks.length === 0) {
            return "MEDICAL RECORDS: No medical record content available.\n\n";
        }

        let formatted = `MEDICAL RECORDS CONTENT (Most Relevant Chunks):\n\n`;

        const chunksByRecord = chunks.reduce((acc: any, chunk: RelevantChunk) => {
            const recordId = chunk.patientMedicalRecord.id;
            if (!acc[recordId]) {
                acc[recordId] = {
                    title: chunk.patientMedicalRecord.title || "Untitled",
                    type: chunk.patientMedicalRecord.type || "CONSULTATION",
                    createdAt: chunk.patientMedicalRecord.createdAt,
                    chunks: [],
                };
            }
            acc[recordId].chunks.push(chunk);
            return acc;
        }, {});

        Object.values(chunksByRecord).forEach((record: any) => {
            formatted += `--- ${record.title} (Type: ${record.type})`;
            if (record.createdAt) {
                formatted += ` - Date: ${record.createdAt}`;
            }
            formatted += ` ---\n\n`;

            record.chunks
                .sort((a: RelevantChunk, b: RelevantChunk) => {
                    if (a.chunkIndex !== b.chunkIndex) {
                        return a.chunkIndex - b.chunkIndex;
                    }
                    return (b.similarity || 0) - (a.similarity || 0);
                })
                .forEach((chunk: RelevantChunk) => {
                    formatted += `${chunk.chunkText}`;
                    if (chunk.similarity !== null && chunk.similarity !== undefined) {
                        formatted += ` [Relevance: ${(chunk.similarity * 100).toFixed(1)}%]`;
                    }
                    formatted += `\n\n`;
                });
        });

        return formatted;
    }

    private formatPatientData(patient: any): string {
        let formatted = `PATIENT INFORMATION:\n`;
        formatted += `Name: ${patient.firstName} ${patient.middleName || ""} ${patient.lastName}\n`;
        if (patient.dateOfBirth) {
            formatted += `Date of Birth: ${patient.dateOfBirth}\n`;
        }
        if (patient.gender) {
            formatted += `Gender: ${patient.gender}\n`;
        }
        if (patient.phoneNumber) {
            formatted += `Phone: ${patient.phoneNumber}\n`;
        }
        if (patient.email) {
            formatted += `Email: ${patient.email}\n`;
        }
        formatted += `\n`;

        if (patient.patientAllergies && patient.patientAllergies.length > 0) {
            formatted += `ALLERGIES:\n`;
            patient.patientAllergies.forEach((allergy: any) => {
                formatted += `- ${allergy.allergen} (Reaction: ${allergy.reactionType})\n`;
            });
            formatted += `\n`;
        }

        if (patient.patientActiveMedications && patient.patientActiveMedications.length > 0) {
            formatted += `ACTIVE MEDICATIONS:\n`;
            patient.patientActiveMedications.forEach((med: any) => {
                formatted += `- ${med.drugName} (${med.dosage}, ${med.frequency})`;
                if (med.reason) {
                    formatted += ` - Reason: ${med.reason}`;
                }
                if (med.notes) {
                    formatted += ` - Notes: ${med.notes}`;
                }
                formatted += `\n`;
            });
            formatted += `\n`;
        }

        if (patient.patientProblemLists && patient.patientProblemLists.length > 0) {
            formatted += `PROBLEM LIST:\n`;
            patient.patientProblemLists.forEach((problem: any) => {
                formatted += `- ${problem.problem} (Severity: ${problem.severity}, Status: ${problem.status})`;
                if (problem.notes) {
                    formatted += ` - Notes: ${problem.notes}`;
                }
                formatted += `\n`;
            });
            formatted += `\n`;
        }

        if (patient.patientGoals && patient.patientGoals.length > 0) {
            formatted += `GOALS:\n`;
            patient.patientGoals.forEach((goal: any) => {
                formatted += `- ${goal.description} (Target Date: ${goal.targetDate}, Status: ${goal.status})`;
                if (goal.notes) {
                    formatted += ` - Notes: ${goal.notes}`;
                }
                formatted += `\n`;
            });
            formatted += `\n`;
        }

        if (patient.patientTreatmentPlans && patient.patientTreatmentPlans.length > 0) {
            formatted += `TREATMENT PLANS:\n`;
            patient.patientTreatmentPlans.forEach((plan: any) => {
                formatted += `- ${plan.planName} (${plan.startDate} to ${plan.endDate}, Status: ${plan.status})\n`;
            });
            formatted += `\n`;
        }

        if (patient.patientLabResults && patient.patientLabResults.length > 0) {
            formatted += `LAB RESULTS:\n`;
            patient.patientLabResults.forEach((lab: any) => {
                formatted += `- ${lab.bioMarkerName}: ${lab.value} ${lab.unit || ""}`;
                if (lab.referenceRange) {
                    formatted += ` (Reference: ${lab.referenceRange})`;
                }
                if (lab.status) {
                    formatted += ` - Status: ${lab.status}`;
                }
                formatted += `\n`;
            });
            formatted += `\n`;
        }

        return formatted;
    }

    private buildSummarySystemPrompt(): string {
        return `You are a clinical AI assistant generating concise, accurate patient summaries for healthcare providers.
      
      Guidelines:
      1. Focus on clinically relevant information.
      2. Organize logically: demographics, conditions, medications, allergies, treatments, and recent findings.
      3. Highlight key updates and important abnormalities.
      4. Use professional medical terminology appropriately.
      5. If data is missing, note it briefly.
      6. Never infer or fabricate details.
      7. Maintain patient privacy at all times.
      
      End every summary with this disclaimer:
        "Disclaimer: This summary is generated automatically for clinical reference and does not replace professional medical judgment."`;
    }

    private buildSummaryUserPrompt(patientData: string, medicalRecords: string): string {
        return `Generate a concise, well-structured patient summary based on the following data:
        
        ${patientData}
        
        ${medicalRecords}
        
        Include:
        - Patient demographics
        - Active problems and diagnoses
        - Current medications and dosages
        - Known allergies
        - Treatment plans and goals
        - Recent labs and key results
        - Brief medical history overview
        
        Keep it factual, clinically relevant, and under 400 words. End with the standard disclaimer.`;
    }

    async generatePatientSummary(
        params: PatientSummaryParams,
    ): Promise<PatientSummaryResult> {
        const { patientId, organizationId, traceId } = params;
        const cacheKey = this.getPatientSummaryCacheKey(organizationId, patientId);
        const CACHE_TTL_SECONDS = 3600; // 1 hour

        try {
            logger.info("Generating patient AI summary", {
                traceId,
                patientId,
                organizationId,
            });

            const cachedResult = await redis.get(cacheKey);
            if (cachedResult) {
                try {
                    const parsed = JSON.parse(cachedResult) as PatientSummaryResult;
                    logger.info("Patient AI summary retrieved from cache", {
                        traceId,
                        patientId,
                        organizationId,
                        cacheKey,
                    });
                    return parsed;
                } catch (parseError) {
                    logger.warn("Failed to parse cached patient summary, regenerating", {
                        traceId,
                        patientId,
                        organizationId,
                        cacheKey,
                        error: parseError,
                    });
                }
            }

            const patient = await prisma.user.findUnique({
                where: {
                    id: patientId,
                    userType: "PATIENT",
                    organizationUsers: {
                        every: {
                            organizationId,
                        },
                    },
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    middleName: true,
                    email: true,
                    phoneNumber: true,
                    dateOfBirth: true,
                    gender: true,
                    patientAllergies: {
                        where: {
                            deletedAt: null,
                        },
                        select: {
                            allergen: true,
                            reactionType: true,
                        },
                    },
                    patientActiveMedications: {
                        where: {
                            deletedAt: null,
                        },
                        select: {
                            drugName: true,
                            dosage: true,
                            frequency: true,
                            reason: true,
                            notes: true,
                        },
                    },
                    patientProblemLists: {
                        where: {
                            deletedAt: null,
                        },
                        select: {
                            problem: true,
                            severity: true,
                            status: true,
                            notes: true,
                        },
                    },
                    patientGoals: {
                        where: {
                            deletedAt: null,
                        },
                        select: {
                            description: true,
                            targetDate: true,
                            status: true,
                            notes: true,
                        },
                    },
                    patientTreatmentPlans: {
                        where: {
                            deletedAt: null,
                        },
                        select: {
                            planName: true,
                            startDate: true,
                            endDate: true,
                            status: true,
                        },
                    },
                    patientLabResults: {
                        where: {
                            deletedAt: null,
                        },
                        select: {
                            bioMarkerName: true,
                            value: true,
                            unit: true,
                            referenceRange: true,
                            status: true,
                            collectionDate: true,
                        },
                        orderBy: {
                            collectionDate: "desc",
                        },
                        take: 10,
                    },
                },
            });

            if (!patient) {
                throw new Error("Patient not found");
            }

            const queryText = `Generate a comprehensive patient summary including medical history, current conditions, medications, allergies, treatment plans, lab results, and clinical findings for patient summary.`;

            logger.debug("Generating query embedding for semantic search", {
                traceId,
                patientId,
                organizationId,
                queryText,
            });

            const queryEmbeddingResult = await bedrockHelper.generateEmbedding({
                text: queryText,
                organizationId,
                patientId,
                taskType: TaskType.PATIENT_SUMMARY_GENERATION,
                traceId,
            });

            const medicalRecordChunks = await this.findRelevantChunks(
                queryEmbeddingResult.embedding,
                patientId,
                organizationId,
                50,
                0.7,
                traceId,
            );

            const patientData = this.formatPatientData(patient);
            const medicalRecordsText = this.formatMedicalRecordChunks(medicalRecordChunks);
            const systemPrompt = this.buildSummarySystemPrompt();
            const userPrompt = this.buildSummaryUserPrompt(patientData, medicalRecordsText);

            logger.debug("Patient data formatted for summary", {
                traceId,
                patientId,
                patientDataLength: patientData.length,
                medicalRecordChunksCount: medicalRecordChunks.length,
                medicalRecordsTextLength: medicalRecordsText.length,
            });

            const result = await bedrockHelper.generateText({
                systemPrompt,
                userPrompt,
                organizationId,
                patientId,
                taskType: TaskType.PATIENT_SUMMARY_GENERATION,
                maxTokens: 4096,
                temperature: 0.1,
                traceId,
            });

            const summaryResult: PatientSummaryResult = {
                summary: result.text,
                inputTokens: result.inputTokens,
                outputTokens: result.outputTokens,
                latencyMs: result.latencyMs,
            };

            try {
                await redis.set(
                    cacheKey,
                    JSON.stringify(summaryResult),
                    CACHE_TTL_SECONDS,
                );
                logger.debug("Patient AI summary cached successfully", {
                    traceId,
                    patientId,
                    organizationId,
                    cacheKey,
                    ttl: CACHE_TTL_SECONDS,
                });
            } catch (cacheError) {
                logger.warn("Failed to cache patient AI summary", {
                    traceId,
                    patientId,
                    organizationId,
                    cacheKey,
                    error: cacheError,
                });
            }

            logger.info("Patient AI summary generated successfully", {
                traceId,
                patientId,
                organizationId,
                summaryLength: result.text.length,
                inputTokens: result.inputTokens,
                outputTokens: result.outputTokens,
                latencyMs: result.latencyMs,
            });

            return summaryResult;
        } catch (error) {
            logger.error("Error generating patient AI summary", {
                traceId,
                patientId,
                organizationId,
                error: error,
            });
            throw error;
        }
    }
}

export const ragHelper = new RAGHelper();
export default ragHelper;
