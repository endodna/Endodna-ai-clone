/**
 * Patient status type derived from backend data
 */
// export type PatientStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "DEACTIVATED" | "BLOCKED" | "DELETED"
export const PATIENT_STATUS = {
  PENDING: "PENDING",
  INVITED: "INVITED",
  ACTIVE: "ACTIVE",
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