import { prisma } from "../../lib/prisma";
import { TaskType, ChatType, ChatMessageRole } from "@prisma/client";
import { buildOrganizationUserFilter } from "../organization-user.helper";
import ragHelper from "./rag.helper";
import { BaseChatHelper, BaseMessage } from "./base-chat.helper";

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

    private buildSystemPrompt(patientData: string): string {
        return `You are OmniBox, an AI medical assistant helping doctors provide better patient care. You have access to comprehensive patient information and medical records.

        ${this.getOmniBoxIdentityPrompt()}

        PATIENT AND MEDICAL RECORDS CONTEXT:
        ${patientData}

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
        - Focus on providing helpful context and insights based on the patient's medical history, including chart notes, medical records, medications, allergies, and lab results
        - Help doctors understand medical summaries, discuss treatment plans, and provide general medical context as needed
        - Reference chart notes and clinical observations when relevant to the conversation
        - **NEVER** include health card numbers, next of kin details, addresses, phone numbers, email addresses, insurance information, financial information, or any other administrative/identifying information in your responses - doctors can access all of this from patient details
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
                include: {
                    patientAllergies: {
                        where: {
                            organizationId,
                            deletedAt: null,
                        },
                    },
                    patientActiveMedications: {
                        where: {
                            organizationId,
                            deletedAt: null,
                        },
                    },
                    patientProblemLists: {
                        where: {
                            organizationId,
                            deletedAt: null,
                        },
                    },
                    patientGoals: {
                        where: {
                            organizationId,
                            deletedAt: null,
                        },
                    },
                    patientTreatmentPlans: {
                        where: {
                            organizationId,
                            deletedAt: null,
                        },
                    },
                    patientLabResults: {
                        where: {
                            organizationId,
                            deletedAt: null,
                        },
                    },
                    patientChartNotes: {
                        where: {
                            organizationId,
                            deletedAt: null,
                        },
                        include: {
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
                },
            });

            if (!patient) {
                throw new Error("Patient not found");
            }

            const patientData = this.formatPatientData(patient);
            const medicalRecordContextResult = await ragHelper.getRelevantMedicalRecordContext(
                message,
                patientId,
                organizationId,
                5,
                traceId,
            );

            const systemPrompt = this.buildSystemPrompt(patientData + "\n\n" + medicalRecordContextResult.context);
            const tokenCalc = this.calculateTokens(systemPrompt, message);
            const { messages } = this.buildMessagesFromHistory(
                conversation.messages as BaseMessage[],
                message,
                tokenCalc.availableTokens,
            );

            const userMessage = await prisma.patientChatMessage.create({
                data: {
                    conversationId,
                    role: ChatMessageRole.USER,
                    content: message,
                    version: 1,
                },
            });

            const result = await this.generateAIResponse({
                systemPrompt,
                messages,
                organizationId,
                patientId,
                doctorId,
                taskType: TaskType.DIAGNOSIS_ASSISTANCE,
                maxTokens: this.MAX_OUTPUT_TOKENS,
                temperature: this.TEMPERATURE,
                traceId,
            });


            const { content: parsedContent, followUpPrompts } = this.parseChatResponseWithFollowUps(result.text);

            const assistantMessage = await prisma.patientChatMessage.create({
                data: {
                    conversationId,
                    role: ChatMessageRole.ASSISTANT,
                    content: result.text,
                    version: 1,
                    inputTokens: result.inputTokens,
                    outputTokens: result.outputTokens,
                    latencyMs: result.latencyMs,
                    metadata: {
                        chatType,
                        medicalRecordContextUsed: medicalRecordContextResult.citations.length > 0,
                        citations: medicalRecordContextResult.citations,
                        followUpPrompts,
                    },
                },
            });

            await prisma.patientChatMessage.update({
                where: { id: userMessage.id },
                data: {
                    inputTokens: result.inputTokens,
                    outputTokens: 0,
                    latencyMs: result.latencyMs,
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
                responseLength: result.text.length,
                inputTokens: result.inputTokens,
                outputTokens: result.outputTokens,
                latencyMs: result.latencyMs,
                method: "PatientChatHelper.sendMessage",
            });

            return {
                messageId: assistantMessage.id,
                content: parsedContent,
                followUpPrompts,
                inputTokens: result.inputTokens,
                outputTokens: result.outputTokens,
                latencyMs: result.latencyMs,
                citations: medicalRecordContextResult.citations,
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

