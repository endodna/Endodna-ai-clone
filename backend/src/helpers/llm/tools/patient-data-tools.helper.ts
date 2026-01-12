import { prisma } from "../../../lib/prisma";
import { Status } from "@prisma/client";
import { logger } from "../../logger.helper";
import { buildOrganizationUserFilter } from "../../organization-user.helper";
import { gaugeFromAcmgLabels, REVERSED_ACMG_SEVERITY } from "../../gauge-algorithm.helper";
import loincHelper from "../../loinc/loinc.helper";

export interface ToolCall {
    id: string;
    name: string;
    input: any;
}

export interface ToolResult {
    toolUseId: string;
    content: string;
    isError?: boolean;
}

class PatientDataToolsHelper {

    getPatientDataTools() {
        return [
            {
                name: "get_patient_basic_info",
                description: "Get patient demographics, vitals, and health metrics.",
                input_schema: {
                    type: "object",
                    properties: {},
                    required: [],
                },
            },
            {
                name: "get_patient_dna_results",
                description: "Get DNA test results: SNPs, genotypes, genes.",
                input_schema: {
                    type: "object",
                    properties: {
                        geneName: {
                            type: "string",
                            description: "Optional: Filter by gene name",
                        },
                        snpName: {
                            type: "string",
                            description: "Optional: Filter by SNP name",
                        },
                    },
                    required: [],
                },
            },
            {
                name: "get_patient_genetic_reports",
                description: "Get genetic reports with categories, variants, interpretations.",
                input_schema: {
                    type: "object",
                    properties: {
                        title: {
                            type: "string",
                            description: "Optional: Filter by report title",
                        },
                    },
                    required: [],
                },
            },
            {
                name: "get_patient_medications",
                description: "Get active medications: dosages, frequencies, reasons.",
                input_schema: {
                    type: "object",
                    properties: {},
                    required: [],
                },
            },
            {
                name: "get_patient_lab_results",
                description: "Get lab results: biomarkers, values, reference ranges.",
                input_schema: {
                    type: "object",
                    properties: {
                        biomarkerName: {
                            type: "string",
                            description: "Optional: Filter by biomarker name",
                        },
                        limit: {
                            type: "number",
                            description: "Optional: Max results (default: 20)",
                        },
                    },
                    required: [],
                },
            },
            {
                name: "get_patient_allergies",
                description: "Get patient allergies and reactions.",
                input_schema: {
                    type: "object",
                    properties: {},
                    required: [],
                },
            },
            {
                name: "get_patient_chart_notes",
                description: "Get chart notes and clinical observations.",
                input_schema: {
                    type: "object",
                    properties: {
                        limit: {
                            type: "number",
                            description: "Optional: Max notes (default: 10)",
                        },
                    },
                    required: [],
                },
            },
            {
                name: "get_patient_problem_list",
                description: "Get problem list: conditions, severity, status.",
                input_schema: {
                    type: "object",
                    properties: {},
                    required: [],
                },
            },
            {
                name: "get_patient_treatment_plans",
                description: "Get treatment plans: names, dates, status.",
                input_schema: {
                    type: "object",
                    properties: {},
                    required: [],
                },
            },
            {
                name: "get_patient_dosage_history",
                description: "Get dosage history: T100, T200, estradiol with dosages, dates, doctors.",
                input_schema: {
                    type: "object",
                    properties: {
                        type: {
                            type: "string",
                            description: "Optional: Filter by type (T100, T200, ESTRADIOL)",
                        },
                        limit: {
                            type: "number",
                            description: "Optional: Max records (default: 20)",
                        },
                    },
                    required: [],
                },
            },
            {
                name: "calculate_gauge_from_pathogenicity",
                description: "Calculate gauge (color, severity, score) from ACMG/AMP pathogenicity labels. Returns green/yellow/red based on worst-case aggregation.",
                input_schema: {
                    type: "object",
                    properties: {
                        pathogenicityLabels: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            description: "Array of pathogenicity labels",
                        },
                    },
                    required: ["pathogenicityLabels"],
                },
            },
            {
                name: "search_loinc_codes",
                description: "Search for LOINC codes by biomarker name, component, or other criteria. Use this to identify standardized LOINC codes for lab results when parsing medical records.",
                input_schema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Search query (e.g., 'glucose', 'testosterone', 'hemoglobin A1c')",
                        },
                        limit: {
                            type: "number",
                            description: "Maximum number of results (default: 10)",
                        },
                        component_filter: {
                            type: "string",
                            description: "Filter by component name",
                        },
                        system_filter: {
                            type: "string",
                            description: "Filter by system (e.g., 'Blood', 'Serum', 'Plasma')",
                        },
                    },
                    required: ["query"],
                },
            },
            {
                name: "get_loinc_code_details",
                description: "Get detailed information about a specific LOINC code including formal name, component, property, system, and units.",
                input_schema: {
                    type: "object",
                    properties: {
                        loincCode: {
                            type: "string",
                            description: "LOINC code (e.g., '2339-0', '24331-1')",
                        },
                    },
                    required: ["loincCode"],
                },
            },
            {
                name: "match_biomarker_to_loinc",
                description: "Match a biomarker name to its corresponding LOINC code. Use this when parsing lab results from medical records to get standardized LOINC codes. This is the preferred method for identifying LOINC codes.",
                input_schema: {
                    type: "object",
                    properties: {
                        biomarkerName: {
                            type: "string",
                            description: "Biomarker name (e.g., 'Glucose', 'Total Testosterone', 'Hemoglobin A1c')",
                        },
                        unit: {
                            type: "string",
                            description: "Optional: Unit of measurement to help match (e.g., 'mg/dL', 'ng/dL', 'pg/mL', '%')",
                        },
                    },
                    required: ["biomarkerName"],
                },
            },
        ];
    }

    async executeTool(
        toolCall: ToolCall,
        patientId: string,
        organizationId: number,
        traceId?: string,
    ): Promise<ToolResult> {
        try {
            logger.info("Executing patient data tool", {
                traceId,
                toolName: toolCall.name,
                patientId,
                organizationId,
                input: toolCall.input,
            });

            let result: string;

            switch (toolCall.name) {
                case "get_patient_basic_info":
                    result = await this.getPatientBasicInfo(patientId, organizationId, traceId);
                    break;
                case "get_patient_dna_results":
                    result = await this.getPatientDNAResults(
                        patientId,
                        organizationId,
                        toolCall.input as { geneName?: string; snpName?: string },
                        traceId,
                    );
                    break;
                case "get_patient_genetic_reports":
                    result = await this.getPatientGeneticReports(
                        patientId,
                        organizationId,
                        toolCall.input as { title?: string },
                        traceId,
                    );
                    break;
                case "get_patient_medications":
                    result = await this.getPatientMedications(patientId, organizationId, traceId);
                    break;
                case "get_patient_lab_results":
                    result = await this.getPatientLabResults(
                        patientId,
                        organizationId,
                        toolCall.input as { biomarkerName?: string; limit?: number },
                        traceId,
                    );
                    break;
                case "get_patient_allergies":
                    result = await this.getPatientAllergies(patientId, organizationId, traceId);
                    break;
                case "get_patient_chart_notes":
                    result = await this.getPatientChartNotes(
                        patientId,
                        organizationId,
                        toolCall.input as { limit?: number },
                        traceId,
                    );
                    break;
                case "get_patient_problem_list":
                    result = await this.getPatientProblemList(patientId, organizationId, traceId);
                    break;
                case "get_patient_treatment_plans":
                    result = await this.getPatientTreatmentPlans(patientId, organizationId, traceId);
                    break;
                case "get_patient_dosage_history":
                    result = await this.getPatientDosageHistory(
                        patientId,
                        organizationId,
                        toolCall.input as { type?: string; limit?: number },
                        traceId,
                    );
                    break;
                case "calculate_gauge_from_pathogenicity":
                    result = await this.calculateGaugeFromPathogenicity(
                        toolCall.input as { pathogenicityLabels: string[] },
                        traceId,
                    );
                    break;
                case "search_loinc_codes":
                    result = await this.searchLOINCCodes(
                        toolCall.input as { query: string; limit?: number; component_filter?: string; system_filter?: string },
                        traceId,
                    );
                    break;
                case "get_loinc_code_details":
                    result = await this.getLOINCCodeDetails(
                        toolCall.input as { loincCode: string },
                        traceId,
                    );
                    break;
                case "match_biomarker_to_loinc":
                    result = await this.matchBiomarkerToLOINC(
                        toolCall.input as { biomarkerName: string; unit?: string },
                        traceId,
                    );
                    break;
                default:
                    throw new Error(`Unknown tool: ${toolCall.name}`);
            }

            return {
                toolUseId: toolCall.id,
                content: result,
            };
        } catch (error) {
            logger.error("Error executing patient data tool", {
                traceId,
                toolName: toolCall.name,
                patientId,
                organizationId,
                error: error,
            });

            return {
                toolUseId: toolCall.id,
                content: `Error: ${error instanceof Error ? error.message : String(error)}`,
                isError: true,
            };
        }
    }

    private async getPatientBasicInfo(
        patientId: string,
        organizationId: number,
        traceId?: string,
    ): Promise<string> {
        logger.debug("Getting patient basic info", {
            traceId,
            patientId,
            organizationId,
            method: "PatientDataToolsHelper.getPatientBasicInfo",
        });

        const patient = await prisma.user.findFirst({
            where: {
                id: patientId,
                ...buildOrganizationUserFilter(organizationId),
            },
            include: {
                patientInfo: {
                    where: {
                        organizationId,
                    },
                },
            },
        });

        if (!patient) {
            return "Patient not found";
        }

        let info = `PATIENT BASIC INFORMATION:\n`;
        info += `Name: ${patient.firstName} ${patient.middleName || ""} ${patient.lastName}\n`;
        if (patient.dateOfBirth) {
            info += `Date of Birth: ${patient.dateOfBirth}\n`;
        }
        if (patient.gender) {
            info += `Gender: ${patient.gender}\n`;
        }
        if (patient.patientInfo) {
            if (patient.patientInfo.weight) {
                info += `Weight: ${patient.patientInfo.weight} kg\n`;
            }
            if (patient.patientInfo.height) {
                info += `Height: ${patient.patientInfo.height} cm\n`;
            }
            if (patient.patientInfo.bmi) {
                info += `BMI: ${patient.patientInfo.bmi}\n`;
            }
            if (patient.patientInfo.bloodType) {
                info += `Blood Type: ${patient.patientInfo.bloodType}\n`;
            }
        }

        info += `\n`;

        if (patient.patientInfo?.clinicalData) {
            const clinical = patient.patientInfo.clinicalData as Record<string, any>;
            const clinicalEntries: string[] = [];

            Object.entries(clinical).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    clinicalEntries.push(`${key}: ${value}`);
                }
            });

            if (clinicalEntries.length > 0) {
                info += `CLINICAL DATA: ${clinicalEntries.join(', ')}\n`;
            }
        }

        return info;
    }

    private async getPatientDNAResults(
        patientId: string,
        organizationId: number,
        input: { geneName?: string; snpName?: string },
        traceId?: string,
    ): Promise<string> {
        logger.debug("Getting patient DNA results", {
            traceId,
            patientId,
            organizationId,
            input,
            method: "PatientDataToolsHelper.getPatientDNAResults",
        });

        const dnaKit = await prisma.patientDNAResultKit.findFirst({
            where: {
                patientId,
                organizationId,
                deletedAt: null,
                isProcessed: true,
            },
            include: {
                patientDNAResultBreakdown: {
                    where: {
                        ...(input.geneName && {
                            masterSNP: {
                                geneName: {
                                    contains: input.geneName,
                                    mode: "insensitive",
                                },
                            },
                        }),
                        ...(input.snpName && {
                            snpName: {
                                contains: input.snpName,
                                mode: "insensitive",
                            },
                        }),
                    },
                    include: {
                        masterSNP: {
                            select: {
                                rsId: true,
                                geneName: true,
                                geneSummary: true,
                                chromosome: true,
                                position_GRCh38: true,
                                referenceAllele: true,
                                altAllele: true,
                            },
                        },
                    },
                    take: 100,
                },
            },
            orderBy: { createdAt: "desc" },
        });

        if (!dnaKit || dnaKit.patientDNAResultBreakdown.length === 0) {
            return "No DNA results found for this patient.";
        }

        let result = `DNA GENETIC RESULTS (${dnaKit.patientDNAResultBreakdown.length} variants):\n\n`;

        const geneMap = new Map<string, Array<typeof dnaKit.patientDNAResultBreakdown[0]>>();
        dnaKit.patientDNAResultBreakdown.forEach((breakdown) => {
            const gene = breakdown.masterSNP?.geneName || "Unknown";
            if (!geneMap.has(gene)) {
                geneMap.set(gene, []);
            }
            geneMap.get(gene)!.push(breakdown);
        });

        geneMap.forEach((breakdowns, gene) => {
            result += `${gene}: `;
            const snps = breakdowns.map((bd) => `${bd.snpName} (${bd.genotype})`).join(", ");
            result += snps;
            result += `\n`;
        });

        return result;
    }

    private async getPatientGeneticReports(
        patientId: string,
        organizationId: number,
        input: { title?: string },
        traceId?: string,
    ): Promise<string> {
        logger.debug("Getting patient genetic reports", {
            traceId,
            patientId,
            organizationId,
            input,
            method: "PatientDataToolsHelper.getPatientGeneticReports",
        });

        const patientDNAResults = await prisma.patientDNAResultKit.findFirst({
            where: {
                patientId,
                organizationId,
                deletedAt: null,
                isProcessed: true,
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                patientDNAResultBreakdown: {
                    select: {
                        snpName: true,
                        genotype: true,
                        masterSNP: {
                            select: {
                                rsId: true,
                                geneName: true,
                                geneSummary: true,
                                chromosome: true,
                                position_GRCh38: true,
                                referenceAllele: true,
                                altAllele: true,
                            },
                        },
                    },
                },
            },
        });

        const reports = await prisma.patientReport.findMany({
            where: {
                patientId,
                organizationId,
                deletedAt: null,
                status: Status.ACTIVE,
                ...(input.title && {
                    report: {
                        title: {
                            contains: input.title,
                            mode: "insensitive",
                        },
                    },
                }),
            },
            include: {
                report: {
                    select: {
                        code: true,
                        title: true,
                        description: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        if (reports.length === 0) {
            return "No genetic reports found for this patient.";
        }

        let result = `GENETIC REPORTS (${reports.length} reports):\n\n`;

        for (const patientReport of reports) {
            result += `REPORT: ${patientReport.report.code} - ${patientReport.report.title}\n`;
            if (patientReport.report.description) {
                result += `Description: ${patientReport.report.description}\n`;
            }

            const reportCategories = await prisma.reportCategory.findMany({
                where: {
                    reportId: patientReport.reportId,
                },
                select: {
                    id: true,
                    name: true,
                    reportCategorySNPs: {
                        select: {
                            id: true,
                            rsID: true,
                            genotype: true,
                            pathogenicity: true,
                            sources: true,
                            description: true,
                        },
                    },
                },
            });

            if (reportCategories.length > 0) {
                result += `Categories:\n`;

                for (const category of reportCategories) {
                    const categorySnps = new Set(category.reportCategorySNPs.map((snp) => snp.rsID));
                    const variants: Array<{
                        rsID: string;
                        geneName?: string | null;
                        genotype: string;
                        pathogenicity: string;
                        geneSummary?: string | null;
                        chromosome?: number | null;
                        position?: number | null;
                    }> = [];

                    for (const rsID of categorySnps) {
                        const patientDNASNP = patientDNAResults?.patientDNAResultBreakdown.find(
                            (s) => s.snpName === rsID,
                        );
                        if (!patientDNASNP) {
                            continue;
                        }
                        const reportCategorySNP = category.reportCategorySNPs.find(
                            (s) => s.rsID === rsID,
                        );
                        if (!reportCategorySNP) {
                            continue;
                        }

                        variants.push({
                            rsID: patientDNASNP.snpName,
                            geneName: patientDNASNP.masterSNP?.geneName,
                            genotype: patientDNASNP.genotype || reportCategorySNP.genotype || "",
                            pathogenicity: reportCategorySNP.pathogenicity,
                            geneSummary: patientDNASNP.masterSNP?.geneSummary,
                            chromosome: patientDNASNP.masterSNP?.chromosome,
                            position: patientDNASNP.masterSNP?.position_GRCh38,
                        });
                    }

                    if (variants.length > 0) {
                        const gaugeResult = gaugeFromAcmgLabels(
                            variants.map((v) => v.pathogenicity),
                        );
                        const variantStatus =
                            REVERSED_ACMG_SEVERITY[gaugeResult.maxSeverity || 0] || "unknown";

                        result += `  - ${category.name} (${variants.length} variants)\n`;
                        result += `    Overall Status: ${variantStatus} (${gaugeResult.color} - score: ${gaugeResult.normalizedScore?.toFixed(2) || "N/A"})\n`;

                        variants.forEach((variant) => {
                            result += `    * ${variant.rsID}`;
                            if (variant.geneName) {
                                result += ` (${variant.geneName})`;
                            }
                            result += `: ${variant.pathogenicity} - ${variant.genotype}\n`;
                        });
                    } else {
                        result += `  - ${category.name} (0 matching variants in patient DNA)\n`;
                    }
                }
            }
            result += `\n`;
        }

        return result;
    }

    private async getPatientMedications(
        patientId: string,
        organizationId: number,
        traceId?: string,
    ): Promise<string> {
        logger.debug("Getting patient medications", {
            traceId,
            patientId,
            organizationId,
            method: "PatientDataToolsHelper.getPatientMedications",
        });

        const medications = await prisma.patientActiveMedication.findMany({
            where: {
                patientId,
                organizationId,
                deletedAt: null,
            },
            orderBy: { createdAt: "desc" },
        });

        if (medications.length === 0) {
            return "No active medications found for this patient.";
        }

        let result = `ACTIVE MEDICATIONS (${medications.length}):\n\n`;
        medications.forEach((med) => {
            result += `- ${med.drugName}: ${med.dosage}, ${med.frequency}`;
            if (med.reason) {
                result += ` (Reason: ${med.reason})`;
            }
            if (med.notes) {
                result += ` - Notes: ${med.notes}`;
            }
            result += `\n`;
        });

        return result;
    }

    private async getPatientLabResults(
        patientId: string,
        organizationId: number,
        input: { biomarkerName?: string; limit?: number },
        traceId?: string,
    ): Promise<string> {
        logger.debug("Getting patient lab results", {
            traceId,
            patientId,
            organizationId,
            input,
            method: "PatientDataToolsHelper.getPatientLabResults",
        });

        const limit = input.limit || 20;
        const labResults = await prisma.patientLabResult.findMany({
            where: {
                patientId,
                organizationId,
                deletedAt: null,
                ...(input.biomarkerName && {
                    bioMarkerName: {
                        contains: input.biomarkerName,
                        mode: "insensitive",
                    },
                }),
            },
            orderBy: { collectionDate: "desc" },
            take: limit,
        });

        if (labResults.length === 0) {
            return "No lab results found for this patient.";
        }

        let result = `LAB RESULTS (${labResults.length} results):\n\n`;
        labResults.forEach((lab) => {
            result += `- ${lab.bioMarkerName}: ${lab.value} ${lab.unit || ""}`;
            if (lab.referenceRange) {
                result += ` (Reference: ${lab.referenceRange})`;
            }
            if (lab.status) {
                result += ` - Status: ${lab.status}`;
            }
            if (lab.collectionDate) {
                result += ` - Date: ${lab.collectionDate}`;
            }
            result += `\n`;
        });

        return result;
    }

    private async getPatientAllergies(
        patientId: string,
        organizationId: number,
        traceId?: string,
    ): Promise<string> {
        logger.debug("Getting patient allergies", {
            traceId,
            patientId,
            organizationId,
            method: "PatientDataToolsHelper.getPatientAllergies",
        });

        const allergies = await prisma.patientAllergy.findMany({
            where: {
                patientId,
                organizationId,
                deletedAt: null,
            },
        });

        if (allergies.length === 0) {
            return "No allergies recorded for this patient.";
        }

        let result = `ALLERGIES (${allergies.length}):\n\n`;
        allergies.forEach((allergy) => {
            result += `- ${allergy.allergen} (Reaction: ${allergy.reactionType})\n`;
        });

        return result;
    }

    private async getPatientChartNotes(
        patientId: string,
        organizationId: number,
        input: { limit?: number },
        traceId?: string,
    ): Promise<string> {
        logger.debug("Getting patient chart notes", {
            traceId,
            patientId,
            organizationId,
            input,
            method: "PatientDataToolsHelper.getPatientChartNotes",
        });

        const limit = input.limit || 10;
        const notes = await prisma.patientChartNote.findMany({
            where: {
                patientId,
                organizationId,
                deletedAt: null,
            },
            orderBy: { updatedAt: "desc" },
            take: limit,
        });

        if (notes.length === 0) {
            return "No chart notes found for this patient.";
        }

        let result = `CHART NOTES (${notes.length} notes):\n\n`;
        notes.forEach((note) => {
            if (note.title) {
                result += `${note.title}\n`;
            }
            result += `${note.content}`;
            result += `\n\n`;
        });

        return result;
    }

    private async getPatientProblemList(
        patientId: string,
        organizationId: number,
        traceId?: string,
    ): Promise<string> {
        logger.debug("Getting patient problem list", {
            traceId,
            patientId,
            organizationId,
            method: "PatientDataToolsHelper.getPatientProblemList",
        });

        const problems = await prisma.patientProblemList.findMany({
            where: {
                patientId,
                organizationId,
                deletedAt: null,
            },
        });

        if (problems.length === 0) {
            return "No problems recorded for this patient.";
        }

        let result = `PROBLEM LIST (${problems.length}):\n\n`;
        problems.forEach((problem) => {
            result += `- ${problem.problem} (Severity: ${problem.severity}, Status: ${problem.status})`;
            if (problem.notes) {
                result += ` - Notes: ${problem.notes}`;
            }
            result += `\n`;
        });

        return result;
    }

    private async getPatientTreatmentPlans(
        patientId: string,
        organizationId: number,
        traceId?: string,
    ): Promise<string> {
        logger.debug("Getting patient treatment plans", {
            traceId,
            patientId,
            organizationId,
            method: "PatientDataToolsHelper.getPatientTreatmentPlans",
        });

        const plans = await prisma.patientTreatmentPlan.findMany({
            where: {
                patientId,
                organizationId,
                deletedAt: null,
            },
        });

        if (plans.length === 0) {
            return "No treatment plans found for this patient.";
        }

        let result = `TREATMENT PLANS (${plans.length}):\n\n`;
        plans.forEach((plan) => {
            result += `- ${plan.planName} (${plan.startDate} to ${plan.endDate}, Status: ${plan.status})\n`;
        });

        return result;
    }

    private async calculateGaugeFromPathogenicity(
        input: { pathogenicityLabels: string[] },
        traceId?: string,
    ): Promise<string> {
        logger.debug("Calculating gauge from pathogenicity labels", {
            traceId,
            labelsCount: input.pathogenicityLabels.length,
            method: "PatientDataToolsHelper.calculateGaugeFromPathogenicity",
        });

        const gaugeResult = gaugeFromAcmgLabels(input.pathogenicityLabels);
        const variantStatus = REVERSED_ACMG_SEVERITY[gaugeResult.maxSeverity || 0] || "unknown";

        let result = `GAUGE CALCULATION RESULT:\n`;
        result += `Color: ${gaugeResult.color.toUpperCase()}\n`;
        result += `Max Severity: ${gaugeResult.maxSeverity ?? "N/A"} (${variantStatus})\n`;
        result += `Normalized Score: ${gaugeResult.normalizedScore?.toFixed(2) ?? "N/A"}\n`;
        result += `Input Labels: ${input.pathogenicityLabels.join(", ")}\n`;

        if (gaugeResult.unknownLabels.length > 0) {
            result += `Unknown Labels: ${gaugeResult.unknownLabels.join(", ")}\n`;
        }

        result += `\nInterpretation:\n`;
        if (gaugeResult.color === "green") {
            result += `- Low risk: All variants are benign or likely benign\n`;
        } else if (gaugeResult.color === "yellow") {
            result += `- Moderate risk: Contains variants of uncertain significance (VUS)\n`;
        } else {
            result += `- High risk: Contains likely impactful or impactful variants\n`;
        }

        return result;
    }

    private async getPatientDosageHistory(
        patientId: string,
        organizationId: number,
        input: { type?: string; limit?: number },
        traceId?: string,
    ): Promise<string> {
        logger.debug("Getting patient dosage history", {
            traceId,
            patientId,
            organizationId,
            input,
            method: "PatientDataToolsHelper.getPatientDosageHistory",
        });

        const limit = input.limit || 20;
        const dosageHistory = await prisma.patientDosageHistory.findMany({
            where: {
                patientId,
                organizationId,
                ...(input.type && {
                    type: input.type as any,
                }),
            },
            select: {
                id: true,
                data: true,
                isOverridden: true,
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
                createdAt: "desc",
            },
            take: limit,
        });

        if (dosageHistory.length === 0) {
            return "No dosage history found for this patient.";
        }

        let result = `DOSAGE HISTORY (${dosageHistory.length} records):\n\n`;

        dosageHistory.forEach((history) => {

            let parsedData: any = null;
            if (history.data) {
                try {
                    parsedData = typeof history.data === 'string' ? JSON.parse(history.data) : history.data;
                } catch {
                    // Skip if data is not valid JSON
                }
            }

            if (parsedData) {
                if (parsedData.dosageMg !== undefined) {
                    result += `Dosage: ${parsedData.dosageMg} mg\n`;
                }
                if (parsedData.pelletsCount !== undefined) {
                    result += `Pellets Count: ${parsedData.pelletsCount}\n`;
                }
            }

            if (history.isOverridden) {
                result += `Status: Overridden\n`;
            }
            if (history.doctor) {
                result += `Prescribed by: ${history.doctor.firstName} ${history.doctor.lastName}\n`;
            }
            if (history.createdAt) {
                result += `Date: ${history.createdAt.toISOString()}\n`;
            }
            if (parsedData && Object.keys(parsedData).length > 0) {
                const additionalData: any = { ...parsedData };
                delete additionalData.dosageMg;
                delete additionalData.pelletsCount;
                if (Object.keys(additionalData).length > 0) {
                    result += `Additional Data: ${JSON.stringify(additionalData)}\n`;
                }
            }
            result += `\n`;
        });

        return result;
    }

    private async searchLOINCCodes(
        input: { query: string; limit?: number; component_filter?: string; system_filter?: string },
        traceId?: string,
    ): Promise<string> {
        const result = await loincHelper.searchLOINCCodes(
            {
                query: input.query,
                limit: input.limit || 10,
                component_filter: input.component_filter,
                system_filter: input.system_filter,
                include_details: true,
            },
            traceId,
        );

        if (!result.results || result.results.length === 0) {
            return `No LOINC codes found for query: "${input.query}"`;
        }

        let output = `LOINC CODE SEARCH RESULTS (${result.count} total, showing ${result.results.length}):\n\n`;
        result.results.forEach((code) => {
            output += `Code: ${code.LOINC_NUM || "N/A"}\n`;
            output += `Long Name: ${code.LONG_COMMON_NAME || "N/A"}\n`;
            if (code.COMPONENT) {
                output += `Component: ${code.COMPONENT}\n`;
            }
            if (code.PROPERTY) {
                output += `Property: ${code.PROPERTY}\n`;
            }
            if (code.SYSTEM) {
                output += `System: ${code.SYSTEM}\n`;
            }
            if (code.SCALE) {
                output += `Scale: ${code.SCALE}\n`;
            }
            output += `\n`;
        });

        return output;
    }

    private async getLOINCCodeDetails(
        input: { loincCode: string },
        traceId?: string,
    ): Promise<string> {
        const code = await loincHelper.getLOINCDetails(input.loincCode, traceId);

        if (!code) {
            return `LOINC code "${input.loincCode}" not found or error retrieving details.`;
        }

        let output = `LOINC CODE DETAILS:\n\n`;
        output += `Code: ${code.loinc_code}\n`;
        if (code.details) {
            const details = code.details;
            output += `Long Name: ${details.LONG_COMMON_NAME || "N/A"}\n`;
            if (details.COMPONENT) {
                output += `Component: ${details.COMPONENT}\n`;
            }
            if (details.PROPERTY) {
                output += `Property: ${details.PROPERTY}\n`;
            }
            if (details.SYSTEM) {
                output += `System: ${details.SYSTEM}\n`;
            }
            if (details.METHOD) {
                output += `Method: ${details.METHOD}\n`;
            }
            if (details.CLASS) {
                output += `Class: ${details.CLASS}\n`;
            }
            if (details.SCALE) {
                output += `Scale: ${details.SCALE}\n`;
            }
            if (details.TIME_ASPCT) {
                output += `Time: ${details.TIME_ASPCT}\n`;
            }
        }
        if (code.answer_list) {
            output += `\nAnswer List: Available\n`;
        }

        return output;
    }

    private async matchBiomarkerToLOINC(
        input: { biomarkerName: string; unit?: string },
        traceId?: string,
    ): Promise<string> {
        const match = await loincHelper.matchBiomarkerToLOINC(
            input.biomarkerName,
            input.unit,
            traceId,
        );

        if (!match) {
            return `No matching LOINC code found for biomarker: "${input.biomarkerName}"${input.unit ? ` with unit: "${input.unit}"` : ""}`;
        }

        let output = `MATCHED LOINC CODE:\n\n`;
        output += `Biomarker: ${input.biomarkerName}\n`;
        output += `LOINC Code: ${match.code}\n`;
        output += `Long Name: ${match.longName}\n`;
        if (match.component) {
            output += `Component: ${match.component}\n`;
        }

        return output;
    }
}

export const patientDataToolsHelper = new PatientDataToolsHelper();
export default patientDataToolsHelper;

