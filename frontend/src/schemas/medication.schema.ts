import { z } from "zod";

/**
 * Schema for creating/updating a patient medication
 */
export const medicationSchema = z.object({
    drugName: z.string().min(1, "Name is required"),
    dosage: z.string().min(1, "Dosage is required"),
    frequency: z.string().min(1, "Frequency is required"),
    reason: z.string().min(1, "Reason is required"),
    notes: z.string().optional(),
});

/**
 * Type inference from medicationSchema
 */
export type MedicationFormValues = z.infer<typeof medicationSchema>;

