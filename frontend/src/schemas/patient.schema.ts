import { GENDER_OPTIONS } from "@/components/constants/patient";
import { z } from "zod";

/**
 * Phone number validation regex
 */
export const PHONE_NUMBER_REGEX = /^\+?[1-9]\d{1,14}$/;

/**
 * Schema for adding a new patient
 * Matches the UI requirements and backend expectations
 */
export const addPatientSchema = z.object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    email: z.email({ message: "Invalid email format" }).toLowerCase().trim(),
    dateOfBirth: z.string().min(1, { message: "Date of birth is required" }),
    gender: z.enum(GENDER_OPTIONS.map((option) => option.value) as [string, ...string[]], { message: "Gender is required" }),
    phoneNumber: z.string().regex(PHONE_NUMBER_REGEX, { message: "Invalid phone number format" }),
    homePhone: z.string().optional().refine(
        (val) => !val || PHONE_NUMBER_REGEX.test(val),
        { message: "Invalid phone number format" }
    ),
    workPhone: z.string().optional().refine(
        (val) => !val || PHONE_NUMBER_REGEX.test(val),
        { message: "Invalid phone number format" }
    ),
});

/**
 * Type inference from addPatientSchema
 */
export type AddPatientFormData = z.infer<typeof addPatientSchema>;
