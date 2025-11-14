import { ChatType, DNAResultStatus, MedicalRecordType, Status } from "@prisma/client";
import { z } from "zod";

// Auth schemas
export const loginSchema = z
  .object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
  .strict();

export type LoginSchema = z.infer<typeof loginSchema>;

export const createSuperAdminSchema = z
  .object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    middleName: z.string().optional(),
  })
  .strict();
export type CreateSuperAdminSchema = z.infer<typeof createSuperAdminSchema>;

export const provisionOrganizationSchema = z
  .object({
    name: z.string().min(1, "Name is required").trim(),
    isPrimary: z.boolean().optional().default(false),
    admin: z
      .object({
        email: z.string().email("Invalid email format").toLowerCase().trim(),
        password: z
          .string()
          .min(6, "Password must be at least 6 characters")
          .optional(),
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        middleName: z.string().optional(),
      })
      .strict(),
  })
  .strict();

export type ProvisionOrganizationSchema = z.infer<
  typeof provisionOrganizationSchema
>;

export const createOrganizationAdminSchema = z
  .object({
    email: z.string().email("Invalid email format").toLowerCase().trim(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    middleName: z.string().optional(),
    organizationId: z.string().uuid("Invalid organization ID"),
  })
  .strict();
export type CreateOrganizationAdminSchema = z.infer<
  typeof createOrganizationAdminSchema
>;

export const createAdminSchema = z
  .object({
    email: z.string().email("Invalid email format").toLowerCase().trim(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    middleName: z.string().optional(),
  })
  .strict();
export type CreateAdminSchema = z.infer<typeof createAdminSchema>;

export const createDoctorSchema = z
  .object({
    email: z.string().email("Invalid email format").toLowerCase().trim(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    middleName: z.string().optional(),
  })
  .strict();
export type CreateDoctorSchema = z.infer<typeof createDoctorSchema>;

export const createPatientSchema = z
  .object({
    email: z.string().email("Invalid email format").toLowerCase().trim(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    middleName: z.string().optional(),
    gender: z.string().optional(),
    dateOfBirth: z
      .coerce
      .date()
      .transform((val) => val.toISOString())
      .optional(),
    phoneNumber: z.string().optional(),
    workPhone: z.string().optional(),
    homePhone: z.string().optional(),
  })
  .strict();
export type CreatePatientSchema = z.infer<typeof createPatientSchema>;

export const validateLoginSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
  })
  .strict();
export type ValidateLoginSchema = z.infer<typeof validateLoginSchema>;

export const setPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type SetPasswordSchema = z.infer<typeof setPasswordSchema>;

export const forgotPasswordSchema = z
  .object({
    email: z.string().email("Invalid email format").toLowerCase().trim(),
  })
  .strict();
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export const getPatientsSchema = z
  .object({
    page: z.string().transform(val => Number(val)).optional(),
    limit: z.string().transform(val => Number(val)).optional(),
    search: z.string().trim().toLowerCase().optional(),
    doctorId: z.string().uuid("Invalid doctor ID").optional(),
    status: z
      .union([z.nativeEnum(Status), z.nativeEnum(DNAResultStatus)])
      .optional(),
  })
  .strict();
export type GetPatientsSchema = z.infer<typeof getPatientsSchema>;

export const createPatientActiveMedicationSchema = z
  .object({
    drugName: z.string().min(1, "Drug name is required"),
    dosage: z.string().min(1, "Dosage is required"),
    frequency: z.string().min(1, "Frequency is required"),
    startDate: z
      .coerce
      .date()
      .transform((val) => val.toISOString())
      .optional(),
    endDate: z
      .coerce
      .date()
      .transform((val) => val.toISOString())
      .optional(),
    reason: z.string().min(1, "Reason is required"),
    notes: z.string().optional(),
  })
  .strict();
export type CreatePatientActiveMedicationSchema = z.infer<
  typeof createPatientActiveMedicationSchema
>;

export const triggerCronActionSchema = z
  .object({
    action: z.enum(["medicalRecords", "pendingDNAFiles", "invalidateAllPatientSummaryCaches"]),
  })
  .strict();

export type TriggerCronActionSchema = z.infer<typeof triggerCronActionSchema>;

export const patientIdParamsSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
}).strict();
export type PatientIdParamsSchema = z.infer<typeof patientIdParamsSchema>;

export const medicationIdParamsSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  medicationId: z.string().transform(val => Number(val))
}).strict();
export type MedicationIdParamsSchema = z.infer<typeof medicationIdParamsSchema>;

export const createPatientMedicalRecordSchema = z.object({
  title: z.string().optional(),
  type: z.nativeEnum(MedicalRecordType).optional(),
}).strict();
export type CreatePatientMedicalRecordSchema = z.infer<typeof createPatientMedicalRecordSchema>;

export const conversationIdParamsSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  conversationId: z.string().uuid("Invalid conversation ID"),
}).strict();
export type ConversationIdParamsSchema = z.infer<typeof conversationIdParamsSchema>;

export const createPatientConversationSchema = z.object({
  type: z.nativeEnum(ChatType).optional(),
}).strict();
export type CreatePatientConversationSchema = z.infer<typeof createPatientConversationSchema>;

export const sendPatientMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
}).strict();
export type SendPatientMessageSchema = z.infer<typeof sendPatientMessageSchema>;

export const updateConversationTitleSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
}).strict();
export type UpdateConversationTitleSchema = z.infer<typeof updateConversationTitleSchema>;

export const registerPatientDNAKitSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
}).strict();
export type RegisterPatientDNAKitSchema = z.infer<typeof registerPatientDNAKitSchema>;
