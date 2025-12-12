import { prisma } from "../../lib/prisma";
import { logger } from "../logger.helper";
import bedrockHelper from "../aws/bedrock.helper";
import { TaskType } from "@prisma/client";
import redis from "../../lib/redis";
import { buildOrganizationUserFilter } from "../organization-user.helper";
import tokenUsageHelper, { MODEL_ID } from "../token-usage.helper";
import { prefilledDataFields } from "./prefilledDataField";
import patientDataToolsHelper from "./tools/patient-data-tools.helper";

export interface PatientSummaryParams {
    patientId: string;
    organizationId: number;
    doctorId?: string;
    traceId?: string;
}

export interface PatientSummaryResult {
    summary: string;
    followUpPrompts: string[];
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    toolCallsUsed?: string[];
    toolCallsCount?: number;
}

interface RelevantChunk {
    id: number;
    chunkText: string;
    chunkIndex: number;
    similarity: number | null;
    patientMedicalRecord: {
        id: number;
        uuid: string;
        title: string | null;
        type: string | null;
        createdAt: Date;
    };
}

class RAGHelper {
    private getPatientSummaryCacheKey(organizationId: number, patientId: string): string {
        return `PATIENT_SUMMARY:${organizationId}:${patientId}`;
    }

    private getPatientSummaryCacheHitCountKey(organizationId: number, patientId: string): string {
        return `PATIENT_SUMMARY_HIT_COUNT:${organizationId}:${patientId}`;
    }

    async invalidatePatientSummaryCache(
        organizationId: number,
        patientId: string,
        traceId?: string,
    ): Promise<void> {
        const cacheKey = this.getPatientSummaryCacheKey(organizationId, patientId);
        const cacheHitCountKey = this.getPatientSummaryCacheHitCountKey(organizationId, patientId);

        try {
            const deleted = await redis.del(cacheKey);
            await redis.del(cacheHitCountKey);
            logger.info("Patient summary cache invalidated", {
                traceId,
                patientId,
                organizationId,
                cacheKey,
                deleted,
                method: "RAGHelper.invalidatePatientSummaryCache",
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

    async invalidateAllPatientSummaryCaches(traceId?: string): Promise<void> {
        try {
            const cacheKeys = await redis.keys("PATIENT_SUMMARY:*");
            const cacheHitCountKeys = await redis.keys("PATIENT_SUMMARY_HIT_COUNT:*");

            const allKeys = [...cacheKeys, ...cacheHitCountKeys];

            if (allKeys.length === 0) {
                logger.info("No patient summary caches to invalidate", {
                    traceId,
                    method: "RAGHelper.invalidateAllPatientSummaryCaches",
                });
                return;
            }

            let deletedCount = 0;
            for (const key of allKeys) {
                const deleted = await redis.del(key);
                if (deleted > 0) {
                    deletedCount++;
                }
            }

            logger.info("All patient summary caches invalidated", {
                traceId,
                totalKeys: allKeys.length,
                deletedCount,
                method: "RAGHelper.invalidateAllPatientSummaryCaches",
            });
        } catch (error) {
            logger.error("Error invalidating all patient summary caches", {
                traceId,
                error: error,
            });
            throw error;
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
            if (!queryEmbedding || queryEmbedding.length === 0) {
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
                                uuid: true,
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
                        uuid: chunk.patientMedicalRecord.uuid,
                        title: chunk.patientMedicalRecord.title,
                        type: chunk.patientMedicalRecord.type,
                        createdAt: chunk.patientMedicalRecord.createdAt,
                    },
                }));
            }

            const embeddingString = `[${queryEmbedding.join(",")}]`;

            let chunks = await prisma.$queryRawUnsafe<any[]>(`
                SELECT 
                    c.id,
                    c."chunkText",
                    c."chunkIndex",
                    c."patientMedicalRecordId",
                    (1 - (c.embedding <=> $1::vector)) as similarity,
                    r.id as "recordId",
                    r.uuid as "recordUuid",
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
                        r.id as "recordId",
                        r.uuid as "recordUuid",
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
                                uuid: true,
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
                        uuid: chunk.patientMedicalRecord.uuid,
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
                    id: chunk.recordId || chunk.patientMedicalRecordId,
                    uuid: chunk.recordUuid,
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
                method: "RAGHelper.findRelevantChunks",
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
                            uuid: true,
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
                    uuid: chunk.patientMedicalRecord.uuid,
                    title: chunk.patientMedicalRecord.title,
                    type: chunk.patientMedicalRecord.type,
                    createdAt: chunk.patientMedicalRecord.createdAt,
                },
            }));
        }
    }

    async getRelevantMedicalRecordContext(
        query: string,
        patientId: string,
        organizationId: number,
        limit: number = 5,
        traceId?: string,
    ): Promise<{
        context: string;
        citations: Array<{
            chunkId: number;
            medicalRecordId: string;
            title: string | null;
            type: string | null;
            similarity: number | null;
            chunkIndex: number;
            textExcerpt: string;
        }>;
    }> {
        try {
            const embeddingResult = await bedrockHelper.generateEmbedding({
                text: query,
                organizationId,
                patientId,
                taskType: TaskType.SIMILARITY_SEARCH,
                traceId,
            });

            const chunks = await this.findRelevantChunks(
                embeddingResult.embedding,
                patientId,
                organizationId,
                limit,
                0.7,
                traceId,
            );

            if (chunks.length === 0) {
                return {
                    context: "",
                    citations: [],
                };
            }

            const citations = chunks.map((chunk) => ({
                chunkId: chunk.id,
                medicalRecordId: chunk.patientMedicalRecord.uuid,
                title: chunk.patientMedicalRecord.title,
                type: chunk.patientMedicalRecord.type,
                similarity: chunk.similarity,
                chunkIndex: chunk.chunkIndex,
                textExcerpt: chunk.chunkText,
            }));

            let context = `RELEVANT MEDICAL RECORD CONTEXT:\n`;
            chunks.forEach((chunk, index) => {
                context += `[Context ${index + 1}]\n`;
                context += `${chunk.chunkText}\n`;
                if (chunk.patientMedicalRecord.title) {
                    context += `Source: ${chunk.patientMedicalRecord.title} (${chunk.patientMedicalRecord.type || "N/A"})\n`;
                }
                context += `\n`;
            });

            return {
                context,
                citations,
            };
        } catch (error) {
            logger.warn("Failed to retrieve medical record context", {
                traceId,
                patientId,
                organizationId,
                error,
            });
            return {
                context: "",
                citations: [],
            };
        }
    }

    private formatMedicalRecordChunks(chunks: RelevantChunk[]): string {
        if (!chunks || chunks.length === 0) {
            return "MEDICAL RECORDS: No medical record content available.\n";
        }

        let formatted = `MEDICAL RECORDS CONTENT (Most Relevant Chunks):\n`;

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
        if (patient.patientInfo) {
            if (patient.patientInfo.weight) {
                formatted += `Weight: ${patient.patientInfo.weight} kg\n`;
            }
            if (patient.patientInfo.height) {
                formatted += `Height: ${patient.patientInfo.height} cm\n`;
            }
            if (patient.patientInfo.bmi) {
                formatted += `BMI: ${patient.patientInfo.bmi}\n`;
            }
            if (patient.patientInfo.bloodType) {
                formatted += `Blood Type: ${patient.patientInfo.bloodType}\n`;
            }
        }
        formatted += `\n`;

        if (patient.patientInfo?.clinicalData) {
            const clinical = patient.patientInfo.clinicalData;
            const clinicalEntries: string[] = [];

            Object.entries(clinical).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    clinicalEntries.push(`${key}: ${value}`);
                }
            });

            if (clinicalEntries.length > 0) {
                formatted += `CLINICAL DATA: ${clinicalEntries.join(', ')}\n\n`;
            }
        }

        if (patient.patientInfo?.lifestyleData) {
            const lifestyle = patient.patientInfo.lifestyleData;
            const lifestyleEntries: string[] = [];

            Object.entries(lifestyle).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    if (Array.isArray(value)) {
                        lifestyleEntries.push(`${key}: ${value.join(', ')}`);
                    } else {
                        lifestyleEntries.push(`${key}: ${value}`);
                    }
                }
            });

            if (lifestyleEntries.length > 0) {
                formatted += `LIFESTYLE DATA: ${lifestyleEntries.join(', ')}\n\n`;
            }
        }

        if (patient.patientInfo?.medicationsData) {
            const medications = patient.patientInfo.medicationsData;
            const medicationsEntries: string[] = [];

            Object.entries(medications).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    if (Array.isArray(value)) {
                        medicationsEntries.push(`${key}: ${value.join(', ')}`);
                    } else {
                        medicationsEntries.push(`${key}: ${value}`);
                    }
                }
            });

            if (medicationsEntries.length > 0) {
                formatted += `MEDICATIONS DATA: ${medicationsEntries.join(', ')}\n\n`;
            }
        }

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

        if (patient.patientChartNotes && patient.patientChartNotes.length > 0) {
            formatted += `CHART NOTES:\n`;
            patient.patientChartNotes.forEach((note: any) => {
                if (note.title) {
                    formatted += `<strong>${note.title}</strong>\n`;
                }
                formatted += `${note.content}`;
                if (note.doctor) {
                    formatted += ` (By: ${note.doctor.firstName} ${note.doctor.lastName})`;
                }
                if (note.updatedAt) {
                    formatted += ` - ${note.updatedAt}`;
                }
                formatted += `\n\n`;
            });
            formatted += `\n`;
        }

        if (patient.patientReports && patient.patientReports.length > 0) {
            formatted += `PATIENT REPORTS:\n`;
            patient.patientReports.forEach((patientReport: any) => {
                if (patientReport.report) {
                    formatted += `- ${patientReport.report.code}: ${patientReport.report.title}`;
                    if (patientReport.report.description) {
                        formatted += ` - ${patientReport.report.description}`;
                    }
                    if (patientReport.createdAt) {
                        formatted += ` - ${patientReport.createdAt}`;
                    }
                    formatted += `\n`;
                }
            });
            formatted += `\n`;
        }

        return formatted;
    }

    private replaceNewlinesWithBr(text: string): string {
        if (!text) {
            return text;
        }
        return text.replace(/\n/g, '\n');
    }

    private parseSummaryWithFollowUps(fullText: string): { summary: string; followUpPrompts: string[] } {
        const followUpSectionRegex = /##\s*Suggested\s*Follow-up\s*Questions\s*\n([\s\S]*?)(?=\n---|\n\*\*|$)/i;
        const match = fullText.match(followUpSectionRegex);

        let summary = fullText;
        let followUpPrompts: string[] = [];

        if (match) {
            const followUpSection = match[1].trim();
            summary = fullText.replace(followUpSectionRegex, '').trim();

            const bulletPointRegex = /^[-*]\s*(.+)$/gm;
            const prompts = [];
            let promptMatch;

            while ((promptMatch = bulletPointRegex.exec(followUpSection)) !== null) {
                prompts.push(promptMatch[1].trim());
            }

            followUpPrompts = prompts.filter(p => p.length > 0);
        }

        return { summary, followUpPrompts };
    }

    private parseSummaryWithPrefilledData(text: string, includePrefilledData: boolean = false): {
        summary: string;
        followUpPrompts: string[];
        prefilledData: Record<string, any> | null;
    } {
        let summary = text;
        let prefilledData: Record<string, any> | null = null;

        if (includePrefilledData) {
            const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
            const jsonMatch = text.match(jsonBlockRegex);

            if (jsonMatch && jsonMatch[1]) {
                try {
                    const parsed = JSON.parse(jsonMatch[1].trim());
                    if (parsed.prefilledData && typeof parsed.prefilledData === 'object') {
                        prefilledData = parsed.prefilledData;
                        summary = text.replace(jsonBlockRegex, '').trim();
                    }
                } catch (parseError) {
                    logger.warn("Failed to parse prefilledData JSON block", {
                        error: parseError,
                        method: "RAGHelper.parseSummaryWithPrefilledData",
                    });
                }
            }
        }

        const { summary: parsedSummary, followUpPrompts } = this.parseSummaryWithFollowUps(summary);

        return {
            summary: parsedSummary,
            followUpPrompts,
            prefilledData,
        };
    }

    private buildSummarySystemPrompt(): string {
        return `You are a clinical AI assistant that generates **markdown-formatted**, concise, and accurate patient summaries for healthcare providers. You have access to patient information through tools that you can call when needed.
      
        **PRIVACY RULE**: NEVER include health card numbers, insurance numbers, addresses, phone numbers, emails, SSNs, government IDs, financial info, or next of kin. Focus ONLY on clinical information: conditions, medications, allergies, lab results, treatments, diagnoses, and observations.
      
        Guidelines:
        1. Present summary in **Markdown** format with clear section headers (##).
        2. Use **bold** or bullet points for important data.
        3. Be factual and concise — avoid speculation.
        4. Extract ALL clinical information from medical records, chart notes, and patient reports.
        5. Combine information from multiple sources; use the most recent or detailed version.
        6. Calculate age accurately using patient's date of birth and current date.
        7. If information is missing, note explicitly (e.g., "_No recent lab results available._").
        8. Do **not** include meta-comments or transitional phrases. Start directly with summary content.
        9. Use two spaces + newline for line breaks within paragraphs, or two newlines for paragraph breaks.
        
        Include this disclaimer at the end:
        ---
        *Disclaimer: This summary is generated automatically for clinical reference and does not replace professional medical judgment.*
        ---`;
    }

    private buildSummaryUserPromptWithTools(medicalRecords: string, includePrefilledData: boolean = false): string {
        const currentDate = new Date();
        const currentDateISO = currentDate.toISOString();
        const currentDateFormatted = currentDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const currentTimeFormatted = currentDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'UTC',
            hour12: false
        });

        const prefilledFieldsSection = includePrefilledData ? `
        **REQUIRED CLINICAL DATA FIELDS - MUST BE INCLUDED:**
        ${this.buildPrefilledDataFieldsInstructions()}
        ` : '';

        const jsonTemplate = includePrefilledData ? prefilledDataFields.map(f => `"${f.id}": null`).join(",\n            ") : '';
        const structuredDataSection = includePrefilledData ? `
        
        **STRUCTURED DATA EXTRACTION**: At the very end of your response, after the disclaimer block, include a JSON code block with the extracted clinical data fields. Use this exact format:
        
        \`\`\`json
        {
          "prefilledData": {
            ${jsonTemplate}
          }
        }
        \`\`\`
        
        For each field found in the medical records, replace \`null\` with the actual value. If a field is not found, keep it as \`null\`. For numeric fields, use numbers. For text fields, use strings. For fields with type "multiple", use an array of values.` : '';

        return `Generate a structured **Markdown** summary for this patient. Use tools to fetch patient information as needed.
      
        ### Current Date and Time
        Current Date: ${currentDateFormatted}
        Current Time: ${currentTimeFormatted}
        ISO 8601 Format: ${currentDateISO}
        
        ### Medical Records
        ${medicalRecords}
        
        **Extract ALL clinical information** from medical records, chart notes, and patient reports. Use tools to fetch and combine patient data. Include: medications, allergies, conditions, diagnoses, treatment plans, lab results, clinical observations, chart notes, and dosage history (T100, T200, estradiol).
        ${prefilledFieldsSection}
        **DATE CALCULATIONS**: Use patient's Date of Birth and Current Date above. Calculate age accurately. Be precise when converting dates to years.
        
        **IMPORTANT - CHART NOTE PROCESSING**: When processing chart notes, carefully examine them for the following structured information:
        
        **1. KINETIC SLOPE CALCULATION (REQUIRED IF PRESENT)**: 
        - MUST check ALL chart notes for "KINETIC SLOPE CALCULATION" heading or any kinetic slope information
        - If found, you MUST create a dedicated "### Kinetic Slope Calculation" section
        - Extract and summarize ALL kinetic slope data including:
          * Testosterone kinetic slope (6-week and 12-week values, change over time, projected target dates)
          * Estradiol kinetic slope (6-week and 12-week values, change over time, projected target dates)
          * Decline rates (pg/mL/week or ng/dL/week)
          * Replenishment interval observations
          * Any comparisons or correlations mentioned
        - DO NOT perform any calculations - ONLY summarize the exact values and findings already present in the chart notes
        - Preserve all numerical values, units, and timeframes exactly as written
        
        **2. CHART NOTE HEADINGS**: When processing chart notes, look for and extract information from these specific headings if present:
        - **CURRENT STATUS**: Include this information in the "Patient Overview" or "Active Conditions" sections
        - **MEDICAL HISTORY**: Include this information in the "Medical History Summary" section
        - **PRESENTING SYMPTOMS**: Include this information in the "Active Conditions" or "Patient Overview" sections
        
        **Output sections** (markdown headings):
        ### Patient Overview  
        ### Active Conditions  
        ### Medications  
        ### Allergies  
        ### Recent Labs and Key Findings  
        ### Kinetic Slope Calculation
        (MUST be included if kinetic slope information is found in chart notes - place this section after "Recent Labs and Key Findings" and before "Clinical Notes")
        ### Clinical Notes (include relevant chart notes)
        ### Medical History Summary  
        ### Suggested Follow-up Questions
        
        Be clear and concise. Use bullet points or short paragraphs. Prioritize most recent/detailed source when information appears in multiple places. Keep medical history summary under 4 paragraphs.
        
        **FOLLOW-UP QUESTIONS**: Provide 3-5 relevant clinical questions as bullet points starting with "- ".${structuredDataSection}`;
    }

    private buildPrefilledDataFieldsInstructions(): string {
        if (prefilledDataFields.length === 0) {
            return "No specific clinical data fields are required at this time.";
        }

        const instructions = [
            "The following clinical data fields MUST be extracted from the medical records and explicitly included in the summary if they are found:",
            ""
        ];

        for (const field of prefilledDataFields) {
            const unitText = field.unit ? ` (in ${field.unit})` : "";
            const exampleText = field.example ? ` Example: ${field.example}${field.unit ? ` ${field.unit}` : ""}` : "";
            const dataTypeText = field.dataType === "number" ? "numeric value" : "text value";

            instructions.push(`- **${field.label}**: Extract the ${dataTypeText}${unitText} if mentioned in any medical record, chart note, or patient report.${exampleText}`);

            if (field.type === "multiple") {
                instructions.push(`  - If multiple values are found, include all of them in an array.`);
            }

            instructions.push("");
        }

        instructions.push("If any of these fields are found in the medical records, they MUST be explicitly stated in the summary with the field name and value clearly visible, AND included in the JSON block at the end. If a field is not found in any record, do not include it in the summary, but include it as null in the JSON block.");

        return instructions.join("\n        ");
    }

    async generatePatientSummary(
        params: PatientSummaryParams,
    ): Promise<PatientSummaryResult> {
        const { patientId, organizationId, doctorId, traceId } = params;
        const cacheKey = this.getPatientSummaryCacheKey(organizationId, patientId);
        const CACHE_TTL_SECONDS = 60 * 60 * 5; // 5 hours

        try {
            logger.info("Generating patient AI summary", {
                traceId,
                patientId,
                organizationId,
                method: "RAGHelper.generatePatientSummary",
            });

            const cachedResult = await redis.get(cacheKey);
            if (cachedResult) {
                try {
                    const parsed = JSON.parse(cachedResult) as PatientSummaryResult;
                    const cleanedSummary = this.replaceNewlinesWithBr(parsed.summary);
                    const followUpPrompts = parsed.followUpPrompts || [];

                    const cacheHitCountKey = this.getPatientSummaryCacheHitCountKey(organizationId, patientId);
                    const cacheHitCount = await redis.incr(cacheHitCountKey);

                    await redis.expire(cacheHitCountKey, CACHE_TTL_SECONDS);

                    logger.info("Patient AI summary retrieved from cache", {
                        traceId,
                        patientId,
                        organizationId,
                        cacheKey,
                        cacheHitCount,
                        method: "RAGHelper.generatePatientSummary",
                    });

                    await tokenUsageHelper.recordUsage({
                        organizationId,
                        patientId,
                        doctorId,
                        taskType: TaskType.PATIENT_SUMMARY_GENERATION,
                        requestType: "TEXT_GENERATION",
                        modelId: MODEL_ID.CHAT_COMPLETION,
                        modelType: "text-generation",
                        inputTokens: parsed.inputTokens,
                        outputTokens: parsed.outputTokens,
                        cacheHit: true,
                        latencyMs: parsed.latencyMs,
                        metadata: {
                            cacheKey,
                            cached: true,
                            cacheHitCount,
                            toolCallsUsed: parsed.toolCallsUsed || [],
                            toolCallsCount: parsed.toolCallsCount || 0,
                        },
                        traceId,
                    });

                    // Note: For cached summaries, we don't save to DB again
                    // The original summary generation would have already saved it

                    return {
                        ...parsed,
                        summary: cleanedSummary,
                        followUpPrompts,
                    };
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

            let patientInfo = await prisma.patientInfo.findUnique({
                where: {
                    patientId: patientId,
                },
                select: {
                    id: true,
                    isOutdated: true,
                    prefilledData: true,
                },
            });

            if (!patientInfo) {
                patientInfo = await prisma.patientInfo.create({
                    data: {
                        patientId: patientId,
                        organizationId: organizationId,
                        isOutdated: true,
                    },
                    select: {
                        id: true,
                        isOutdated: true,
                        prefilledData: true,
                    },
                });

                logger.info("PatientInfo created for patient", {
                    traceId,
                    patientId,
                    organizationId,
                    method: "RAGHelper.generatePatientSummary",
                });
            }

            const isOutdated = patientInfo.isOutdated ?? false;

            const patient = await prisma.user.findFirst({
                where: buildOrganizationUserFilter(organizationId, {
                    id: patientId,
                    userType: "PATIENT",
                }),
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    middleName: true,
                },
            });

            if (!patient) {
                throw new Error("Patient not found");
            }

            logger.debug("Finding relevant chunks", {
                traceId,
                patientId,
                organizationId,
            });

            const medicalRecordChunks = await this.findRelevantChunks(
                [],
                patientId,
                organizationId,
                30,
                0.75,
                traceId,
            );

            const medicalRecordsText = this.formatMedicalRecordChunks(medicalRecordChunks);
            const systemPrompt = this.buildSummarySystemPrompt();
            const tools = patientDataToolsHelper.getPatientDataTools();

            const userPrompt = this.buildSummaryUserPromptWithTools(medicalRecordsText, isOutdated);

            logger.debug("Starting patient summary generation with tools", {
                traceId,
                patientId,
                medicalRecordChunksCount: medicalRecordChunks.length,
                medicalRecordsTextLength: medicalRecordsText.length,
            });

            const messages: Array<{ role: string; content: string | any[] }> = [
                {
                    role: "user",
                    content: userPrompt,
                },
            ];

            const MAX_TOOL_ITERATIONS = 3;
            let finalResponse = "";
            let totalInputTokens = 0;
            let totalOutputTokens = 0;
            let totalLatencyMs = 0;
            const toolCallsUsed: string[] = [];

            for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
                const result = await bedrockHelper.generateChatCompletion({
                    systemPrompt,
                    messages,
                    tools,
                    organizationId,
                    patientId,
                    doctorId,
                    taskType: TaskType.PATIENT_SUMMARY_GENERATION,
                    maxTokens: 2048,
                    temperature: 0.1,
                    traceId,
                });

                totalInputTokens += result.inputTokens;
                totalOutputTokens += result.outputTokens;
                totalLatencyMs += result.latencyMs;

                const assistantContent: any[] = [];
                if (result.text) {
                    assistantContent.push({ type: "text", text: result.text });
                }
                if (result.toolCalls && result.toolCalls.length > 0) {
                    result.toolCalls.forEach(toolCall => {
                        assistantContent.push({
                            type: "tool_use",
                            id: toolCall.id,
                            name: toolCall.name,
                            input: toolCall.input,
                        });
                        toolCallsUsed.push(toolCall.name);
                    });
                }

                messages.push({
                    role: "assistant",
                    content: assistantContent,
                });

                if (!result.toolCalls || result.toolCalls.length === 0) {
                    finalResponse = result.text || "";
                    break;
                }

                const toolResults = await Promise.all(
                    result.toolCalls.map(async (toolCall) => {
                        const toolResult = await patientDataToolsHelper.executeTool(
                            toolCall,
                            patientId,
                            organizationId,
                            traceId,
                        );
                        return {
                            type: "tool_result",
                            tool_use_id: toolResult.toolUseId,
                            content: toolResult.content,
                            is_error: toolResult.isError || false,
                        };
                    }),
                );

                messages.push({
                    role: "user",
                    content: toolResults,
                });
            }

            if (!finalResponse && messages.length > 0) {
                const lastMessage = messages[messages.length - 1];
                if (lastMessage.role === "assistant" && Array.isArray(lastMessage.content)) {
                    const textContent = lastMessage.content.find((c: any) => c.type === "text");
                    finalResponse = textContent?.text || "";
                }
            }

            const result = {
                text: finalResponse,
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                latencyMs: totalLatencyMs,
            };

            let cleanedText = result.text;
            const metaCommentPatterns = [
                /^Now I'll create[^\n]*\n?/i,
                /^Based on the information[^\n]*\n?/i,
                /^Let me summarize[^\n]*\n?/i,
                /^I'll now create[^\n]*\n?/i,
                /^I'll generate[^\n]*\n?/i,
                /^Here is[^\n]*\n?/i,
            ];

            metaCommentPatterns.forEach(pattern => {
                cleanedText = cleanedText.replace(pattern, '');
            });

            cleanedText = cleanedText.trim();

            const { summary: summaryText, followUpPrompts, prefilledData } = this.parseSummaryWithPrefilledData(cleanedText, isOutdated);
            const cleanedSummary = this.replaceNewlinesWithBr(summaryText);

            try {
                if (patientInfo?.isOutdated && prefilledData && Object.keys(prefilledData).length > 0) {
                    const filteredPrefilledData = Object.fromEntries(
                        Object.entries(prefilledData).filter(([_, value]) => value !== null && value !== undefined)
                    );

                    if (Object.keys(filteredPrefilledData).length > 0) {
                        const timestamp = Date.now();
                        const existingPrefilledData = (patientInfo.prefilledData as Record<string, any>) || {};
                        const versionedPrefilledData = {
                            ...existingPrefilledData,
                            [timestamp]: filteredPrefilledData,
                        };

                        await prisma.patientInfo.update({
                            where: {
                                patientId: patientId,
                            },
                            data: {
                                prefilledData: versionedPrefilledData,
                                isOutdated: false,
                            },
                        });

                        logger.info("PrefilledData extracted and updated from summary with versioning", {
                            traceId,
                            patientId,
                            organizationId,
                            timestamp,
                            prefilledDataFields: Object.keys(filteredPrefilledData),
                            extractedValues: filteredPrefilledData,
                            method: "RAGHelper.generatePatientSummary",
                        });
                    } else {
                        await prisma.patientInfo.update({
                            where: {
                                patientId: patientId,
                            },
                            data: {
                                isOutdated: false,
                            },
                        });

                        logger.info("No prefilledData extracted, marked PatientInfo as not outdated", {
                            traceId,
                            patientId,
                            organizationId,
                            method: "RAGHelper.generatePatientSummary",
                        });
                    }
                } else if (patientInfo?.isOutdated && (!prefilledData || Object.keys(prefilledData).length === 0)) {
                    await prisma.patientInfo.update({
                        where: {
                            patientId: patientId,
                        },
                        data: {
                            isOutdated: false,
                        },
                    });
                }
            } catch (prefilledDataError) {
                logger.error("Failed to extract/update prefilledData", {
                    traceId,
                    patientId,
                    organizationId,
                    error: prefilledDataError,
                    method: "RAGHelper.generatePatientSummary",
                });
            }

            const citations = medicalRecordChunks.map((chunk) => ({
                chunkId: chunk.id,
                medicalRecordId: chunk.patientMedicalRecord.uuid,
                title: chunk.patientMedicalRecord.title,
                type: chunk.patientMedicalRecord.type,
                similarity: chunk.similarity,
                chunkIndex: chunk.chunkIndex,
                textExcerpt: chunk.chunkText.substring(0, 200),
            }));

            const summaryResult: PatientSummaryResult = {
                summary: cleanedSummary,
                followUpPrompts,
                inputTokens: result.inputTokens,
                outputTokens: result.outputTokens,
                latencyMs: result.latencyMs,
                toolCallsUsed,
                toolCallsCount: toolCallsUsed.length,
            };

            if (doctorId) {
                try {
                    await prisma.patientSummary.create({
                        data: {
                            patientId,
                            doctorId,
                            organizationId,
                            summary: cleanedSummary,
                            followUpPrompts: followUpPrompts.length > 0 ? followUpPrompts : undefined,
                            context: {
                                medicalRecordsContext: medicalRecordsText,
                                systemPrompt: systemPrompt,
                                userPrompt: userPrompt,
                                chunksUsed: medicalRecordChunks.length,
                                similarityThreshold: 0.7,
                            },
                            citations: citations.length > 0 ? citations : undefined,
                            metadata: {
                                inputTokens: result.inputTokens,
                                outputTokens: result.outputTokens,
                                totalTokens: result.inputTokens + result.outputTokens,
                                latencyMs: result.latencyMs,
                                modelId: MODEL_ID.CHAT_COMPLETION,
                                modelType: "text-generation",
                                temperature: 0.1,
                                maxTokens: 4096,
                                traceId: traceId,
                                cacheKey,
                                generatedAt: new Date().toISOString(),
                                toolCallsUsed,
                                toolCallsCount: toolCallsUsed.length,
                            },
                        },
                    });

                    logger.info("Patient summary saved to database for auditing", {
                        traceId,
                        patientId,
                        organizationId,
                        doctorId,
                        method: "RAGHelper.generatePatientSummary",
                    });
                } catch (dbError) {
                    logger.error("Failed to save patient summary to database", {
                        traceId,
                        patientId,
                        organizationId,
                        doctorId,
                        error: dbError,
                        method: "RAGHelper.generatePatientSummary",
                    });
                }
            }

            try {
                await tokenUsageHelper.recordUsage({
                    organizationId,
                    patientId,
                    doctorId,
                    taskType: TaskType.PATIENT_SUMMARY_GENERATION,
                    requestType: "TEXT_GENERATION",
                    modelId: MODEL_ID.CHAT_COMPLETION,
                    modelType: "text-generation",
                    inputTokens: result.inputTokens,
                    outputTokens: result.outputTokens,
                    cacheHit: false,
                    latencyMs: result.latencyMs,
                    metadata: {
                        toolCallsUsed,
                        toolCallsCount: toolCallsUsed.length,
                    },
                    traceId,
                });
            } catch (tokenUsageError) {
                logger.error("Failed to record token usage for patient summary", {
                    traceId,
                    patientId,
                    organizationId,
                    error: tokenUsageError,
                    method: "RAGHelper.generatePatientSummary",
                });
            }

            try {
                await redis.set(
                    cacheKey,
                    JSON.stringify(summaryResult),
                    CACHE_TTL_SECONDS,
                );

                const cacheHitCountKey = this.getPatientSummaryCacheHitCountKey(organizationId, patientId);
                await redis.del(cacheHitCountKey);

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
                toolCallsUsed,
                toolCallsCount: toolCallsUsed.length,
                method: "RAGHelper.generatePatientSummary",
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
