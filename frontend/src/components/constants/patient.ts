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
 * Gender options for patient form
 */
export const GENDER_OPTIONS = [
  { value: "male", label: "Male" } as const,
  { value: "female", label: "Female" } as const,
  { value: "other", label: "Other" } as const,
  { value: "prefer_not_to_say", label: "Prefer not to say" } as const,
] as const;

/**
 * Maximum upload file size in MB
 */
export const MAX_UPLOAD_FILE_SIZE_MB = 999;