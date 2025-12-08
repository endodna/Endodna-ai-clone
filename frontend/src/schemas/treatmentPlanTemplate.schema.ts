import { z } from "zod";

export const treatmentPlanTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  patientIdentificationDemographics: z
    .string()
    .min(1, "Patient identification and demographics are required"),
  medicalHistory: z.string().min(1, "Medical history is required"),
  currentConditionDiagnosis: z
    .string()
    .min(1, "Current condition and diagnosis are required"),
  assessmentData: z.string().min(1, "Assessment data is required"),
  treatmentGoalsExpectedOutcomes: z
    .string()
    .min(1, "Treatment goals and expected outcomes are required"),
  interventionsStrategies: z
    .string()
    .min(1, "Interventions and strategies are required"),
  rolesResponsibilities: z.string().optional(),
  timeline: z.string().optional(),
  progressNotesEvaluation: z.string().optional(),
  dischargePreventionPlan: z.string().optional(),
});

export type TreatmentPlanTemplateFormValues = z.infer<
  typeof treatmentPlanTemplateSchema
>;

export const defaultTreatmentPlanTemplateValues: TreatmentPlanTemplateFormValues =
  {
    name: "",
    patientIdentificationDemographics: "",
    medicalHistory: "",
    currentConditionDiagnosis: "",
    assessmentData: "",
    treatmentGoalsExpectedOutcomes: "",
    interventionsStrategies: "",
    rolesResponsibilities: "",
    timeline: "",
    progressNotesEvaluation: "",
    dischargePreventionPlan: "",
  };


