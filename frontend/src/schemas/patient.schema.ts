import { GENDER_OPTIONS } from "@/components/constants/patient";
import { z } from "zod";

/**
 * Phone number validation regex
 */
export const PHONE_NUMBER_REGEX = /^\+?[1-9]\d{1,14}$/;

/**
 * Type for gender option
 */
export type GenderOption = { value: string; label: string };

/**
 * Schema for adding a new patient
 * Matches the UI requirements and backend expectations
 * @param genderOptions - Array of gender options (defaults to static GENDER_OPTIONS)
 */
export const addPatientSchema = (genderOptions: readonly GenderOption[] | GenderOption[] = GENDER_OPTIONS) => {
    const genderValues = genderOptions.map((option) => option.value) as [string, ...string[]];

    return z.object({
        firstName: z.string().min(1, { message: "First name is required" }),
        lastName: z.string().min(1, { message: "Last name is required" }),
        email: z.email({ message: "Invalid email format" }).toLowerCase().trim(),
        dateOfBirth: z.string().min(1, { message: "Date of birth is required" }),
        gender: z.enum(genderValues, { message: "Gender is required" }),
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
};

/**
 * Default schema instance for type inference
 */
const defaultSchema = addPatientSchema();

/**
 * Type inference from addPatientSchema
 */
export type AddPatientFormData = z.infer<typeof defaultSchema>;
