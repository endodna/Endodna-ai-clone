import { DNAResultStatus, Gender, MedicalRecordType, OrderType, Status } from "@prisma/client";
import { z } from "zod";
import { TempusActions } from "../types";
import { PelletType, DosageTier } from "../types";

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
    bloodType: z.string().optional(),
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

export const dnaKitResultIdParamsSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  dnaKitResultId: z.string().uuid("Invalid DNA kit result ID"),
}).strict();
export type DnaKitResultIdParamsSchema = z.infer<typeof dnaKitResultIdParamsSchema>;

export const updatePatientGeneticsStatusSchema = z.object({
  action: z.nativeEnum(TempusActions),
}).strict();
export type UpdatePatientGeneticsStatusSchema = z.infer<typeof updatePatientGeneticsStatusSchema>;

export const medicationIdParamsSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  medicationId: z.string().uuid("Invalid medication ID")
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

export const sendPatientMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
}).strict();
export type SendPatientMessageSchema = z.infer<typeof sendPatientMessageSchema>;

export const updateConversationTitleSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
}).strict();
export type UpdateConversationTitleSchema = z.infer<typeof updateConversationTitleSchema>;

export const createGeneralConversationSchema = z.object({
  title: z.string().max(200).optional(),
}).strict();
export type CreateGeneralConversationSchema = z.infer<typeof createGeneralConversationSchema>;

export const sendGeneralMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
}).strict();
export type SendGeneralMessageSchema = z.infer<typeof sendGeneralMessageSchema>;

export const generalConversationIdParamsSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation ID"),
}).strict();
export type GeneralConversationIdParamsSchema = z.infer<typeof generalConversationIdParamsSchema>;

export const addressIdParamsSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  addressId: z.string().uuid("Invalid address ID"),
}).strict();
export type AddressIdParamsSchema = z.infer<typeof addressIdParamsSchema>;

export const createPatientAddressSchema = z.object({
  address: z.object({
    street: z.string().optional(),
    street2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }),
  isPrimary: z.boolean().optional().default(false),
}).strict();
export type CreatePatientAddressSchema = z.infer<typeof createPatientAddressSchema>;

export const updatePatientAddressSchema = z.object({
  address: z.object({
    street: z.string().optional(),
    street2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }),
  isPrimary: z.boolean().optional(),
}).strict().refine(
  (data) => {
    return data.address !== undefined || data.isPrimary !== undefined;
  },
  {
    message: "At least one field must be provided for update",
  }
);
export type UpdatePatientAddressSchema = z.infer<typeof updatePatientAddressSchema>;

export const registerPatientDNAKitSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
  orderType: z.nativeEnum(OrderType),
  addressId: z.string().uuid("Invalid address ID").optional(),
  reportId: z.string().uuid("Invalid report ID"),
}).strict();
export type RegisterPatientDNAKitSchema = z.infer<typeof registerPatientDNAKitSchema>;

export const createPatientChartNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "Content is required"),
}).strict();
export type CreatePatientChartNoteSchema = z.infer<typeof createPatientChartNoteSchema>;

export const updatePatientChartNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "Content is required"),
}).strict();
export type UpdatePatientChartNoteSchema = z.infer<typeof updatePatientChartNoteSchema>;

export const chartNoteIdParamsSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  chartNoteId: z.string().uuid("Invalid chart note ID")
}).strict();
export type ChartNoteIdParamsSchema = z.infer<typeof chartNoteIdParamsSchema>;

export const createPatientAllergySchema = z.object({
  allergen: z.string().min(1, "Allergen is required"),
  reactionType: z.string().optional(),
  severity: z.string().optional(),
  notes: z.string().optional(),
}).strict();
export type CreatePatientAllergySchema = z.infer<typeof createPatientAllergySchema>;

export const updatePatientAllergySchema = z.object({
  allergen: z.string().min(1, "Allergen is required").optional(),
  reactionType: z.string().optional(),
  severity: z.string().optional(),
  notes: z.string().optional(),
}).strict();
export type UpdatePatientAllergySchema = z.infer<typeof updatePatientAllergySchema>;

export const allergyIdParamsSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  allergyId: z.string().uuid("Invalid allergy ID")
}).strict();
export type AllergyIdParamsSchema = z.infer<typeof allergyIdParamsSchema>;

export const createPatientAlertSchema = z.object({
  description: z.string().min(1, "Description is required"),
  severity: z.string().optional(),
  notes: z.string().optional(),
}).strict();
export type CreatePatientAlertSchema = z.infer<typeof createPatientAlertSchema>;

export const updatePatientAlertSchema = z.object({
  description: z.string().min(1, "Description is required").optional(),
  severity: z.string().optional(),
  notes: z.string().optional(),
}).strict();
export type UpdatePatientAlertSchema = z.infer<typeof updatePatientAlertSchema>;

export const alertIdParamsSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  alertId: z.string().uuid("Invalid alert ID")
}).strict();
export type AlertIdParamsSchema = z.infer<typeof alertIdParamsSchema>;

export const updateAlertOrAllergyParamsSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  alertId: z.string().uuid("Invalid alert ID"),
  type: z.enum(["allergy", "alert"], { errorMap: () => ({ message: "Type must be 'allergy' or 'alert'" }) })
}).strict();
export type UpdateAlertOrAllergyParamsSchema = z.infer<typeof updateAlertOrAllergyParamsSchema>;

export const createAlertOrAllergyParamsSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  type: z.enum(["allergy", "alert"], { errorMap: () => ({ message: "Type must be 'allergy' or 'alert'" }) })
}).strict();
export type CreateAlertOrAllergyParamsSchema = z.infer<typeof createAlertOrAllergyParamsSchema>;

export const createAlertOrAllergyBodySchema = z.union([
  createPatientAllergySchema,
  createPatientAlertSchema,
]);
export type CreateAlertOrAllergyBodySchema = z.infer<typeof createAlertOrAllergyBodySchema>;

export const updateAlertOrAllergyBodySchema = z.union([
  updatePatientAllergySchema,
  updatePatientAlertSchema,
]);
export type UpdateAlertOrAllergyBodySchema = z.infer<typeof updateAlertOrAllergyBodySchema>;

export const deleteAlertOrAllergyParamsSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  alertId: z.string().uuid("Invalid alert ID"),
  type: z.enum(["allergy", "alert"], { errorMap: () => ({ message: "Type must be 'allergy' or 'alert'" }) })
}).strict();
export type DeleteAlertOrAllergyParamsSchema = z.infer<typeof deleteAlertOrAllergyParamsSchema>;

export const updateOrganizationNameSchema = z.object({
  name: z.string().min(1, "Organization name is required").trim(),
}).strict();
export type UpdateOrganizationNameSchema = z.infer<typeof updateOrganizationNameSchema>;

export const updateOrganizationCustomizationSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Primary color must be a valid hex color code").optional(),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Secondary color must be a valid hex color code").optional(),
  theme: z.enum(["light", "dark", "auto"]).optional(),
  branding: z.object({
    companyName: z.string().optional(),
    tagline: z.string().optional(),
    website: z.string().url("Website must be a valid URL").optional(),
  }).optional(),
  email: z.object({
    fromName: z.string().optional(),
    fromEmail: z.string().email("From email must be a valid email address").optional(),
    replyTo: z.string().email("Reply-to email must be a valid email address").optional(),
  }).optional(),
  features: z.record(z.union([z.boolean(), z.string(), z.number()])).optional(),
}).strict().refine(
  (data) => {
    return (
      data.primaryColor !== undefined ||
      data.secondaryColor !== undefined ||
      data.theme !== undefined ||
      data.branding !== undefined ||
      data.email !== undefined ||
      data.features !== undefined
    );
  },
  {
    message: "At least one customization field must be provided",
  }
);
export type UpdateOrganizationCustomizationSchema = z.infer<typeof updateOrganizationCustomizationSchema>;

export const getReportsSchema = z.object({
  gender: z.nativeEnum(Gender).optional(),
}).strict();
export type GetReportsSchema = z.infer<typeof getReportsSchema>;

export const reportIdParamsSchema = z.object({
  reportId: z.string().uuid("Invalid report ID"),
}).strict();
export type ReportIdParamsSchema = z.infer<typeof reportIdParamsSchema>;

const smokingStatusEnum = z.enum(["never", "former", "current"]);
const exerciseLevelEnum = z.enum(["sedentary", "light", "moderate", "vigorous"]);

const clinicalDataSchema = z.object({
  shbgLevel: z.number().optional(),
  baselineTotalTestosterone: z.number().optional(),
  baselineFreeTestosterone: z.number().optional(),
  postInsertionTotalTestosterone: z.number().optional(),
  insertionDate: z.coerce.date().transform((val) => val.toISOString()).optional(),
  baselineEstradiol: z.number().optional(),
  postInsertionEstradiol: z.number().optional(),
  vitaminDLevel: z.number().optional(),
  hematocrit: z.number().optional(),
  currentPSA: z.number().optional(),
  previousPSA: z.number().optional(),
  monthsBetweenPSA: z.number().optional(),
  prostateSymptomsIpss: z.number().optional(),
  fshLevel: z.number().optional(),
  symptomSeverity: z.number().optional(),
}).strict().optional();

const lifestyleDataSchema = z.object({
  smokingStatus: smokingStatusEnum.optional(),
  exerciseLevel: exerciseLevelEnum.optional(),
}).strict().optional();

const medicationsDataSchema = z.object({
  opiods: z.boolean().optional(),
  opiodsList: z.array(z.string()).optional(),
  adhdStimulants: z.boolean().optional(),
  adhdStimulantsList: z.array(z.string()).optional(),
  otherMedicationsList: z.array(z.string()).optional(),
}).strict().optional();

export const updatePatientInfoSchema = z.object({
  dateOfBirth: z.coerce.date().transform((val) => val.toISOString()).optional(),
  gender: z.string().optional(),
  bloodType: z.string().optional(),
  weight: z.number().positive("Weight must be a positive integer").optional(),
  height: z.number().positive("Height must be a positive integer").optional(),
  clinicalData: clinicalDataSchema,
  lifestyleData: lifestyleDataSchema,
  medicationsData: medicationsDataSchema,
}).strict().refine(
  (data) => {
    return (
      data.dateOfBirth !== undefined ||
      data.gender !== undefined ||
      data.bloodType !== undefined ||
      data.weight !== undefined ||
      data.height !== undefined ||
      data.clinicalData !== undefined ||
      data.lifestyleData !== undefined ||
      data.medicationsData !== undefined
    );
  },
  {
    message: "At least one field must be provided for update",
  }
);
export type UpdatePatientInfoSchema = z.infer<typeof updatePatientInfoSchema>;

export const createReportSchema = z.object({
  code: z.string().min(1, "Code is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  genders: z.array(z.nativeEnum(Gender)).min(1, "At least one gender must be specified"),
  price: z.number().positive("Price must be positive").or(z.string().transform((val) => parseFloat(val))),
}).strict();
export type CreateReportSchema = z.infer<typeof createReportSchema>;

export const updateReportSchema = z.object({
  code: z.string().min(1, "Code is required").optional(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  genders: z.array(z.nativeEnum(Gender)).min(1, "At least one gender must be specified"),
  price: z.number().positive("Price must be positive").or(z.string().transform((val) => parseFloat(val))).optional(),
}).strict().refine(
  (data) => {
    return (
      data.code !== undefined ||
      data.title !== undefined ||
      data.description !== undefined ||
      data.genders !== undefined ||
      data.price !== undefined
    );
  },
  {
    message: "At least one field must be provided for update",
  }
);
export type UpdateReportSchema = z.infer<typeof updateReportSchema>;

export const calculatePatientTestosteroneDosingSuggestionsSchema = z.object({
  pelletType: z.nativeEnum(PelletType)
}).strict();

export type CalculatePatientTestosteroneDosingSuggestionsSchema = z.infer<typeof calculatePatientTestosteroneDosingSuggestionsSchema>;

export const savePatientDosageSchema = z.object({
  isOverridden: z.boolean().default(false),
  T100: z.object({
    tier: z.nativeEnum(DosageTier),
  }).optional(),
  T200: z.object({
    tier: z.nativeEnum(DosageTier),
  }).optional(),
  ESTRADIOL: z.object({
    tier: z.nativeEnum(DosageTier),
  }).optional(),
}).strict();

export type SavePatientDosageSchema = z.infer<typeof savePatientDosageSchema>;

export const goalIdParamsSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  goalId: z.string().uuid("Invalid goal ID")
}).strict();
export type GoalIdParamsSchema = z.infer<typeof goalIdParamsSchema>;

export const createPatientGoalSchema = z.object({
  description: z.string().min(1, "Description is required"),
  allergies: z.array(z.number().int()).optional().default([]),
  medications: z.array(z.number().int()).optional().default([]),
  problems: z.array(z.number().int()).optional().default([]),
  treatments: z.array(z.number().int()).optional().default([]),
  status: z.nativeEnum(Status).optional().default(Status.PENDING),
  notes: z.string().optional().default(""),
}).strict();
export type CreatePatientGoalSchema = z.infer<typeof createPatientGoalSchema>;

export const updatePatientGoalSchema = z.object({
  description: z.string().min(1, "Description is required").optional(),
  allergies: z.array(z.number().int()).optional(),
  medications: z.array(z.number().int()).optional(),
  problems: z.array(z.number().int()).optional(),
  treatments: z.array(z.number().int()).optional(),
  status: z.nativeEnum(Status).optional(),
  notes: z.string().optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});
export type UpdatePatientGoalSchema = z.infer<typeof updatePatientGoalSchema>;