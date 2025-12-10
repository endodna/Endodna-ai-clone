import { prisma } from "../../lib/prisma";
import { TaskType, ChatType, ChatMessageRole } from "@prisma/client";
import { buildOrganizationUserFilter } from "../organization-user.helper";
import { BaseChatHelper, BaseMessage } from "./base-chat.helper";
import patientDataToolsHelper from "./tools/patient-data-tools.helper";

export interface ChatMessage {
    role: ChatMessageRole;
    content: string;
}

export interface SendMessageParams {
    conversationId: string;
    patientId: string;
    doctorId: string;
    organizationId: number;
    message: string;
    chatType: ChatType;
    traceId?: string;
}

export interface SendMessageResult {
    messageId: string;
    content: string;
    followUpPrompts: string[];
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    citations: Array<{
        chunkId: number;
        medicalRecordId: string;
        title: string | null;
        type: string | null;
        similarity: number | null;
        chunkIndex: number;
    }>;
}

class PatientChatHelper extends BaseChatHelper {

    private buildSystemPrompt(chatType: ChatType): string {
        const toolUsageInstructions = chatType === ChatType.DNA_ANALYSIS
            ? `- This is a DNA analysis conversation. You have access to all patient information tools.
        - **Prioritize using DNA and genetic report tools** to fetch patient genetic data when discussing genetic analysis.
        - You can also use other patient data tools (medications, lab results, allergies, medical history, etc.) if the doctor's question requires that information to provide context for the DNA analysis.
        - Actively use the available tools to retrieve relevant genetic and patient information.`
            : `- You have access to patient information tools, but **ONLY use them when the doctor's question explicitly requires specific patient data**.
        - Do NOT call tools for general questions, medical advice, or questions that don't require specific patient information.
        - Only use tools when asked about specific patient data such as: medications, lab results, allergies, medical history, chart notes, treatment plans, or other patient-specific information.
        - If the question is general medical knowledge, treatment recommendations, or doesn't require patient data, answer directly without using tools.`;

        return `You are OmniBox, an AI medical assistant helping doctors provide better patient care.${chatType === ChatType.DNA_ANALYSIS ? ' You specialize in DNA and genetic analysis.' : ''}

        ${this.getOmniBoxIdentityPrompt()}

        **CRITICAL PRIVACY RULE - MUST BE FOLLOWED:**
        - **NEVER** include health card numbers, health insurance numbers, insurance policy numbers, or any health card identifiers in your responses
        - **NEVER** include next of kin information, emergency contact details, or family member contact information in your responses
        - **NEVER** include patient addresses, phone numbers, email addresses, or other contact information in your responses
        - **NEVER** include social security numbers, government IDs, or other administrative identifiers in your responses
        - **NEVER** include financial information, payment details, or billing information in your responses
        - Focus ONLY on clinical information: medical conditions, medications, allergies, lab results, treatments, diagnoses, and clinical observations
        - Doctors can access all administrative and identifying information directly from patient details if needed - it should NOT appear in AI-generated responses
        - If you encounter any administrative, identifying, or financial information in the patient data, completely exclude it from your responses

        ${this.getCommonGuidelinesPrompt()}
        ${toolUsageInstructions}
        - When you have the information you need, provide a clear and helpful response
        - **Use markdown tables** to display structured data when appropriate (e.g., medications, lab results, allergies, treatment plans, dosage history, genetic variants). Tables make data easier to read and compare.
        - Reference specific data points from the tools when relevant
        ${this.getFollowUpQuestionsInstruction()} and patient information`;
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
                    formatted += `${note.title}\n`;
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


    async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
        const {
            conversationId,
            patientId,
            doctorId,
            organizationId,
            message,
            chatType,
            traceId,
        } = params;

        try {
            const conversation = await prisma.patientChatConversation.findFirst({
                where: {
                    id: conversationId,
                    patientId,
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

            const patient = await prisma.user.findFirst({
                where: {
                    id: patientId,
                    ...buildOrganizationUserFilter(organizationId),
                },
                select: {
                    firstName: true,
                    lastName: true,
                    middleName: true,
                },
            });

            if (!patient) {
                throw new Error("Patient not found");
            }

            const systemPrompt = this.buildSystemPrompt(chatType);
            const tools = patientDataToolsHelper.getPatientDataTools();

            const tokenCalc = this.calculateTokens(systemPrompt, message);
            const { messages: historyMessages } = this.buildMessagesFromHistory(
                conversation.messages as BaseMessage[],
                message,
                tokenCalc.availableTokens,
            );

            const messages: Array<{ role: string; content: string | any[] }> = historyMessages.map(msg => ({
                role: msg.role,
                content: msg.content,
            }));

            const userMessage = await prisma.patientChatMessage.create({
                data: {
                    conversationId,
                    role: ChatMessageRole.USER,
                    content: message,
                    version: 1,
                },
            });

            const MAX_TOOL_ITERATIONS = 3;
            let finalResponse = "";
            let totalInputTokens = 0;
            let totalOutputTokens = 0;
            let totalLatencyMs = 0;
            const toolCallsUsed: string[] = [];

            for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
                const result = await this.generateAIResponse({
                    systemPrompt,
                    messages,
                    tools,
                    organizationId,
                    patientId,
                    doctorId,
                    taskType: TaskType.DIAGNOSIS_ASSISTANCE,
                    maxTokens: this.MAX_OUTPUT_TOKENS,
                    temperature: this.TEMPERATURE,
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
                    finalResponse = result.text;
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
                    finalResponse = textContent?.text || "I apologize, but I encountered an issue processing your request.";
                }
            }

            const { content: parsedContent, followUpPrompts } = this.parseChatResponseWithFollowUps(finalResponse);

            const assistantMessage = await prisma.patientChatMessage.create({
                data: {
                    conversationId,
                    role: ChatMessageRole.ASSISTANT,
                    content: finalResponse,
                    version: 1,
                    inputTokens: totalInputTokens,
                    outputTokens: totalOutputTokens,
                    latencyMs: totalLatencyMs,
                    metadata: {
                        chatType,
                        toolCallsUsed,
                        toolCallsCount: toolCallsUsed.length,
                        followUpPrompts,
                    },
                },
            });

            await prisma.patientChatMessage.update({
                where: { id: userMessage.id },
                data: {
                    inputTokens: totalInputTokens,
                    outputTokens: 0,
                    latencyMs: totalLatencyMs,
                },
            });

            await prisma.patientChatConversation.update({
                where: { id: conversationId },
                data: {
                    updatedAt: new Date(),
                },
            });

            this.logMessageSent({
                traceId,
                conversationId,
                patientId,
                doctorId,
                organizationId,
                messageLength: message.length,
                responseLength: finalResponse.length,
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                latencyMs: totalLatencyMs,
                method: "PatientChatHelper.sendMessage",
                toolCallsUsed,
            });

            return {
                messageId: assistantMessage.id,
                content: parsedContent,
                followUpPrompts,
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                latencyMs: totalLatencyMs,
                citations: [],
            };
        } catch (error) {
            this.logMessageError({
                traceId,
                conversationId,
                patientId,
                doctorId,
                organizationId,
                error,
                method: "PatientChatHelper.sendMessage",
            });
            throw error;
        }
    }
}

export const patientChatHelper = new PatientChatHelper();
export default patientChatHelper;

