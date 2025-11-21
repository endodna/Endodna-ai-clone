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


interface UploadedMedicalRecordMetadata {
    originalName?: string;
    size?: number;
    mimetype?: string;
}

interface UploadedMedicalRecord {
    id: number;
    title: string;
    type: string;
    metadata: UploadedMedicalRecordMetadata;
}

interface UploadMedicalRecordsResponse {
    records: UploadedMedicalRecord[];
    count: number;
}

/**
 * Patient detail structure from getPatientById API
 */
interface PatientDetail {
    id: string;
    firstName: string;
    lastName: string;
    status: string;
    dateOfBirth?: string | Date | null;
    gender?: string | null;
    bloodType?: string | null;
    patientDNAResults: Array<{
        uuid: string;
        status: string;
        updatedAt?: string | Date;
        id: string;
    }>;
    patientGoals: Array<{
        uuid: string;
        description: string;
        createdAt?: string | Date;
        id: string;
    }>;
    patientAllergies: Array<{
        uuid: string;
        allergen: string;
        reactionType?: string | null;
        notes?: string | null;
        id: string;
    }>;
    patientAlerts: Array<{
        uuid: string;
        description: string;
        severity?: string | null;
        notes?: string | null;
        id: string;
    }>;
    managingDoctor: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    } | null;
}

interface PatientMedication {
    id: string;
    drugName: string;
    dosage: string;
    frequency: string;
    startDate?: string | null;
    endDate?: string | null;
    reason: string;
    notes?: string | null;
    createdAt?: string | Date;
}

interface CreatePatientMedicationPayload {
    drugName: string;
    dosage: string;
    frequency: string;
    reason: string;
    notes?: string;
    startDate?: string;
    endDate?: string;
}

interface ChatPatientInfo {
    id: string;
    firstName: string;
    lastName: string;
    photo?: string | null;
}

interface ChatConversationPreview {
    id: string;
    type: string;
    title: string;
    createdAt: string | Date;
    updatedAt?: string | Date;
    messages?: Array<{
        id: string;
        role: string;
        content: string;
        createdAt: string | Date;
    }>;
}

interface PatientChatConversation extends ChatConversationPreview {
    patient?: ChatPatientInfo | null;
}

interface GeneralChatConversation extends ChatConversationPreview {}

interface ChatMessage {
    id: string;
    role: string;
    version?: string | null;
    content: string;
    createdAt: string | Date;
    citations?: Array<{ id: string; title: string | null }>;
}

interface SendChatMessageResponse {
    messageId: string;
    content: string;
    followUpPrompts?: string[];
    citations?: Array<{ id: string; title: string | null }>;
}