/**
 * Patient status type
 */
export enum PatientStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  DEACTIVATED = "DEACTIVATED",
  BLOCKED = "BLOCKED",
  DELETED = "DELETED",
  ACHIEVED = "ACHIEVED",
  IN_PROGRESS = "IN_PROGRESS",
  CANCELLED = "CANCELLED",
  RESOLVED = "RESOLVED",
  IN_RANGE = "IN_RANGE",
  OUT_OF_RANGE = "OUT_OF_RANGE",
  LOW = "LOW",
  HIGH = "HIGH",
  ANOMALOUS = "ANOMALOUS",
  READY = "READY",
}

/**
 * DNA result status type
 */
export enum DNAResultStatus {
  PENDING = "PENDING",
  KIT_RECEIVED = "KIT_RECEIVED",
  QC_FAILED = "QC_FAILED",
  QC_PASSED = "QC_PASSED",
  DNA_EXTRACTION_2ND_FAILED = "DNA_EXTRACTION_2ND_FAILED",
  DNA_EXTRACTION_FAILED = "DNA_EXTRACTION_FAILED",
  DNA_EXTRACTION_2ND_ACCEPTED = "DNA_EXTRACTION_2ND_ACCEPTED",
  DNA_EXTRACTION_ACCEPTED = "DNA_EXTRACTION_ACCEPTED",
  GENOTYPING_2ND_FAILED = "GENOTYPING_2ND_FAILED",
  GENOTYPING_FAILED = "GENOTYPING_FAILED",
  GENOTYPING_2ND_ACCEPTED = "GENOTYPING_2ND_ACCEPTED",
  GENOTYPING_ACCEPTED = "GENOTYPING_ACCEPTED",
  HOLD = "HOLD",
  PROCESS = "PROCESS",
  CANCEL = "CANCEL",
  DISCARD = "DISCARD",
}

/**
* Backend API response structure for patient - this is what comes from the API
*/
export interface PatientRow {
  id: string;
  firstName: string;
  lastName: string;
  status: string; // User account status: ACTIVE, PENDING, etc.
  patientDNAResults: Array<{
    id: string;
    status: string; // DNA result status
    updatedAt?: string | Date; // Used to find the most recent result
  }>;
  patientActivities?: Array<{
    id: number;
    activity: string;
    status?: string;
    createdAt?: string | Date; // Fallback if dateCompleted is not available
  }>;
  patientGoals: Array<{
    id: string;
    description: string;
  }>;
  managingDoctor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  dateOfBirth?: string | Date | null; // May not be in current response
}

/**
 * Backend API paginated response structure
 */
export interface PatientsApiResponse {
  items: PatientRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}