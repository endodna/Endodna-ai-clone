/**
 * Patient status constants
 * These values should match the backend enum values
 */
export const PatientStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  PENDING: "PENDING",
  DEACTIVATED: "DEACTIVATED",
  BLOCKED: "BLOCKED",
  DELETED: "DELETED",
  ACHIEVED: "ACHIEVED",
  IN_PROGRESS: "IN_PROGRESS",
  CANCELLED: "CANCELLED",
  RESOLVED: "RESOLVED",
  IN_RANGE: "IN_RANGE",
  OUT_OF_RANGE: "OUT_OF_RANGE",
  LOW: "LOW",
  HIGH: "HIGH",
  ANOMALOUS: "ANOMALOUS",
  READY: "READY",
} as const;

/**
 * DNA result status constants
 * These values should match the backend enum values
 */
export const DNAResultStatus = {
  PENDING: "PENDING",
  KIT_RECEIVED: "KIT_RECEIVED",
  QC_FAILED: "QC_FAILED",
  QC_PASSED: "QC_PASSED",
  DNA_EXTRACTION_2ND_FAILED: "DNA_EXTRACTION_2ND_FAILED",
  DNA_EXTRACTION_FAILED: "DNA_EXTRACTION_FAILED",
  DNA_EXTRACTION_2ND_ACCEPTED: "DNA_EXTRACTION_2ND_ACCEPTED",
  DNA_EXTRACTION_ACCEPTED: "DNA_EXTRACTION_ACCEPTED",
  GENOTYPING_2ND_FAILED: "GENOTYPING_2ND_FAILED",
  GENOTYPING_FAILED: "GENOTYPING_FAILED",
  GENOTYPING_2ND_ACCEPTED: "GENOTYPING_2ND_ACCEPTED",
  GENOTYPING_ACCEPTED: "GENOTYPING_ACCEPTED",
  HOLD: "HOLD",
  PROCESS: "PROCESS",
  CANCEL: "CANCEL",
  DISCARD: "DISCARD",
} as const;

/**
 * Gender options for patient form
 */
export const GENDER_OPTIONS = [
  { value: "male", label: "Male" } as const,
  { value: "female", label: "Female" } as const,
  { value: "other", label: "Other" } as const,
  { value: "prefer_not_to_say", label: "Prefer not to say" } as const,
] as const;