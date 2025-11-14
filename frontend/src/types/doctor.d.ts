interface Doctor {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    userType: string;
}

interface GetDoctorPatientsParams {
    page?: number;
    limit?: number;
    search?: string;
    doctorId?: string;
    status?: string;
}

interface Constants {
    status: string[];
    dnaResultStatus: string[];
    medicalRecordType: string[];
    priority: string[];
    requestType: string[];
    chatType: string[];
    chatMessageRole: string[];
}

/**
* Backend API response structure for patient - this is what comes from the API
*/
interface PatientRow {
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
interface PatientsApiResponse {
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

/**
 * Add patient data
 */
interface AddPatientData {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    email: string;
    phoneNumber: string;
    homePhone?: string;
    workPhone?: string;
}

/**
 * patient added response
 */
interface PatientAddedResponse {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;
    gender: string;
    phoneNumber: string;
    homePhone?: string;
    workPhone?: string;
}