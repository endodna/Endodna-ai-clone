import { prisma } from "../../lib/prisma";
import { logger } from "../logger.helper";
import bedrockHelper from "../aws/bedrock.helper";
import { TaskType, Status } from "@prisma/client";
import redis from "../../lib/redis";
import { buildOrganizationUserFilter } from "../organization-user.helper";
import tokenUsageHelper, { MODEL_ID } from "../token-usage.helper";

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
            return "MEDICAL RECORDS: No medical record content available.<br>";
        }

        let formatted = `MEDICAL RECORDS CONTENT (Most Relevant Chunks):<br>`;

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
            formatted += ` ---<br><br>`;

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
                    formatted += `<br><br>`;
                });
        });

        return formatted;
    }

    private formatPatientData(patient: any): string {
        let formatted = `PATIENT INFORMATION:<br>`;
        formatted += `Name: ${patient.firstName} ${patient.middleName || ""} ${patient.lastName}<br>`;
        if (patient.dateOfBirth) {
            formatted += `Date of Birth: ${patient.dateOfBirth}<br>`;
        }
        if (patient.gender) {
            formatted += `Gender: ${patient.gender}<br>`;
        }
        formatted += `<br>`;

        if (patient.patientAllergies && patient.patientAllergies.length > 0) {
            formatted += `ALLERGIES:<br>`;
            patient.patientAllergies.forEach((allergy: any) => {
                formatted += `- ${allergy.allergen} (Reaction: ${allergy.reactionType})<br>`;
            });
            formatted += `<br>`;
        }

        if (patient.patientActiveMedications && patient.patientActiveMedications.length > 0) {
            formatted += `ACTIVE MEDICATIONS:<br>`;
            patient.patientActiveMedications.forEach((med: any) => {
                formatted += `- ${med.drugName} (${med.dosage}, ${med.frequency})`;
                if (med.reason) {
                    formatted += ` - Reason: ${med.reason}`;
                }
                if (med.notes) {
                    formatted += ` - Notes: ${med.notes}`;
                }
                formatted += `<br>`;
            });
            formatted += `<br>`;
        }

        if (patient.patientProblemLists && patient.patientProblemLists.length > 0) {
            formatted += `PROBLEM LIST:<br>`;
            patient.patientProblemLists.forEach((problem: any) => {
                formatted += `- ${problem.problem} (Severity: ${problem.severity}, Status: ${problem.status})`;
                if (problem.notes) {
                    formatted += ` - Notes: ${problem.notes}`;
                }
                formatted += `<br>`;
            });
            formatted += `<br>`;
        }

        if (patient.patientGoals && patient.patientGoals.length > 0) {
            formatted += `GOALS:<br>`;
            patient.patientGoals.forEach((goal: any) => {
                formatted += `- ${goal.description} (Target Date: ${goal.targetDate}, Status: ${goal.status})`;
                if (goal.notes) {
                    formatted += ` - Notes: ${goal.notes}`;
                }
                formatted += `<br>`;
            });
            formatted += `<br>`;
        }

        if (patient.patientTreatmentPlans && patient.patientTreatmentPlans.length > 0) {
            formatted += `TREATMENT PLANS:<br>`;
            patient.patientTreatmentPlans.forEach((plan: any) => {
                formatted += `- ${plan.planName} (${plan.startDate} to ${plan.endDate}, Status: ${plan.status})<br>`;
            });
            formatted += `<br>`;
        }

        if (patient.patientLabResults && patient.patientLabResults.length > 0) {
            formatted += `LAB RESULTS:<br>`;
            patient.patientLabResults.forEach((lab: any) => {
                formatted += `- ${lab.bioMarkerName}: ${lab.value} ${lab.unit || ""}`;
                if (lab.referenceRange) {
                    formatted += ` (Reference: ${lab.referenceRange})`;
                }
                if (lab.status) {
                    formatted += ` - Status: ${lab.status}`;
                }
                formatted += `<br>`;
            });
            formatted += `<br>`;
        }

        if (patient.patientChartNotes && patient.patientChartNotes.length > 0) {
            formatted += `CHART NOTES:<br>`;
            patient.patientChartNotes.forEach((note: any) => {
                if (note.title) {
                    formatted += `<strong>${note.title}</strong><br>`;
                }
                formatted += `${note.content}`;
                if (note.doctor) {
                    formatted += ` (By: ${note.doctor.firstName} ${note.doctor.lastName})`;
                }
                if (note.updatedAt) {
                    formatted += ` - ${note.updatedAt}`;
                }
                formatted += `<br><br>`;
            });
            formatted += `<br>`;
        }

        if (patient.patientReports && patient.patientReports.length > 0) {
            formatted += `PATIENT REPORTS:<br>`;
            patient.patientReports.forEach((patientReport: any) => {
                if (patientReport.report) {
                    formatted += `- ${patientReport.report.code}: ${patientReport.report.title}`;
                    if (patientReport.report.description) {
                        formatted += ` - ${patientReport.report.description}`;
                    }
                    formatted += ` (Status: ${patientReport.status})`;
                    if (patientReport.createdAt) {
                        formatted += ` - ${patientReport.createdAt}`;
                    }
                    formatted += `<br>`;
                }
            });
            formatted += `<br>`;
        }

        return formatted;
    }

    private replaceNewlinesWithBr(text: string): string {
        if (!text) {
            return text;
        }
        return text.replace(/\n/g, '<br>');
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

    private buildSummarySystemPrompt(): string {
        return `You are a clinical AI assistant that generates **markdown-formatted**, concise, and accurate patient summaries for healthcare providers.
      
        **CRITICAL PRIVACY RULE - MUST BE FOLLOWED:**
        - **NEVER** include health card numbers, health insurance numbers, insurance policy numbers, or any health card identifiers in the summary
        - **NEVER** include next of kin information, emergency contact details, or family member contact information in the summary
        - **NEVER** include patient addresses, phone numbers, email addresses, or other contact information in the summary
        - **NEVER** include social security numbers, government IDs, or other administrative identifiers in the summary
        - **NEVER** include financial information, payment details, or billing information in the summary
        - Focus ONLY on clinical information: medical conditions, medications, allergies, lab results, treatments, diagnoses, and clinical observations
        - Doctors can access all administrative and identifying information directly from patient details if needed - it should NOT appear in AI-generated summaries
        - If you encounter any administrative, identifying, or financial information in the source data, completely exclude it from the summary
      
        Guidelines:
        1. Present the entire summary in **Markdown** format.
        2. Use clear section headers (##) for major categories such as demographics, conditions, medications, allergies, and treatments.
        3. Highlight important data using **bold** or bullet points when appropriate.
        4. Be factual and concise — avoid speculation or filler.
        5. Extract ALL clinical information from medical records and chart notes, including medications, allergies, diagnoses, treatments, lab results, and clinical observations, even if they are not explicitly listed in the structured patient data section.
        6. Combine information from structured patient data, medical record content, and chart notes. If the same information appears in multiple sources, use the most recent or most detailed version.
        7. For date calculations, ALWAYS use the patient's date of birth when calculating age. Calculate age accurately by subtracting the birthdate from the current date or reference date. When converting dates to years (e.g., age, duration of condition), be precise and accurate.
        8. If information is missing, note that explicitly (e.g., "_No recent lab results available._").
        9. Maintain privacy and confidentiality - this includes never including health card numbers, next of kin details, addresses, phone numbers, email addresses, insurance information, financial information, or any other administrative/identifying information.
        10. Do **not** include instructions or meta-comments in the output.
        11. For line breaks in markdown: Use two spaces followed by a newline for line breaks within a paragraph, or use two newlines for paragraph breaks. Do NOT use literal <br> characters - use actual newlines.
        
        At the end of every summary, include this markdown disclaimer block:
        
        ---
        
        *Disclaimer: This summary is generated automatically for clinical reference and does not replace professional medical judgment.*
        
        ---`;
    }

    private buildSummaryUserPrompt(patientData: string, medicalRecords: string): string {
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

        return `Generate a structured **Markdown** summary using the information below.
      
        ### Current Date and Time
        Current Date: ${currentDateFormatted}
        Current Time: ${currentTimeFormatted}
        ISO 8601 Format: ${currentDateISO}
      
        ### Patient Data
        ${patientData}
        
        ### Medical Records
        ${medicalRecords}
        
        **IMPORTANT**: Extract and include ALL relevant clinical information from the medical records and chart notes, even if it's not explicitly listed in the Patient Data section above. This includes:
        - Medications (current and past) mentioned in medical records
        - Allergies and adverse reactions documented in records
        - Medical conditions, diagnoses, and problem lists
        - Treatment plans and interventions
        - Lab results and diagnostic findings
        - Clinical observations and assessments
        - Chart notes with clinical observations, progress notes, and provider comments
        
        **CRITICAL PRIVACY REQUIREMENT - MUST BE FOLLOWED:**
        - **NEVER** include health card numbers, health insurance numbers, insurance policy numbers, or any health card identifiers in the summary
        - **NEVER** include next of kin information, emergency contact details, or family member contact information in the summary
        - **NEVER** include patient addresses, phone numbers, email addresses, or other contact information in the summary
        - **NEVER** include social security numbers, government IDs, or other administrative identifiers in the summary
        - **NEVER** include financial information, payment details, or billing information in the summary
        - Focus ONLY on clinical information: medical conditions, medications, allergies, lab results, treatments, diagnoses, and clinical observations
        - Doctors can access all administrative and identifying information directly from patient details if needed - it should NOT appear in AI-generated summaries
        - If you encounter any administrative, identifying, or financial information in the source data, completely exclude it from the summary
        
        **DATE CALCULATIONS**: When calculating age or converting dates to years:
        - ALWAYS use the patient's Date of Birth from the Patient Data section above
        - Use the Current Date and Time provided above as the reference date for all calculations
        - Calculate age accurately by subtracting the birthdate from the current date provided above
        - Be precise when converting dates to years (e.g., age, duration of conditions, medication duration)
        - Do not estimate or approximate ages - calculate them accurately using the exact current date provided
        
        The output should include the following sections (using markdown headings):
        ## Patient Overview  
        ## Active Conditions  
        ## Medications  
        ## Allergies  
        ## Treatment Plans  
        ## Recent Labs and Key Findings  
        ## Clinical Notes (include relevant information from chart notes)
        ## Medical History Summary  
        ## Suggested Follow-up Questions
        
        Each section should be clear and concise — use bullet points or short paragraphs as needed.  
        Combine information from the Patient Data section, Medical Records section, and Chart Notes. If information appears in multiple sources, prioritize the most recent or most detailed source.
        Keep the full medical history summary under 4 paragraphs and end with the markdown disclaimer block.
        
        **FOLLOW-UP QUESTIONS**: In the "## Suggested Follow-up Questions" section, provide 3-5 relevant clinical questions that a doctor might want to ask based on the patient's medical history, current conditions, medications, or areas that need further investigation. Format each question as a bullet point starting with "- ". These questions should help guide further clinical inquiry and should be based on the clinical information in the summary.`;
    }

    async generatePatientSummary(
        params: PatientSummaryParams,
    ): Promise<PatientSummaryResult> {
        const { patientId, organizationId, doctorId, traceId } = params;
        const cacheKey = this.getPatientSummaryCacheKey(organizationId, patientId);
        const CACHE_TTL_SECONDS = 7200; // 2 hours

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
                    patientChartNotes: {
                        where: {
                            deletedAt: null,
                        },
                        select: {
                            id: true,
                            title: true,
                            content: true,
                            createdAt: true,
                            updatedAt: true,
                            doctor: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                        orderBy: {
                            updatedAt: "desc",
                        },
                    },
                    patientReports: {
                        where: {
                            deletedAt: null,
                            status: Status.ACTIVE,
                        },
                        select: {
                            id: true,
                            status: true,
                            createdAt: true,
                            updatedAt: true,
                            report: {
                                select: {
                                    code: true,
                                    title: true,
                                    description: true,
                                },
                            },
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    },
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
                doctorId,
                taskType: TaskType.PATIENT_SUMMARY_GENERATION,
                maxTokens: 4096,
                temperature: 0.1,
                traceId,
            });

            const { summary: summaryText, followUpPrompts } = this.parseSummaryWithFollowUps(result.text);
            const cleanedSummary = this.replaceNewlinesWithBr(summaryText);

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
                                patientData: patientData,
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
