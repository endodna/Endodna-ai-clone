import apiClient from "../../lib/apiClient";
import { API_ENDPOINTS, getEndpoint } from "./endpoints";
import { AxiosRequestConfig, AxiosProgressEvent, isAxiosError } from "axios";

export interface ApiResponse<T = any> {
  data: T | null;
  error: boolean;
  message: string;
}

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError<ApiResponse>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

// Authentication API
export const authApi = {
  login: async (token: string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN_TOKEN, {
        token,
      });
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message || error.message || "Login failed",
      };
    }
  },

  register: async (email: string, password: string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        email,
        password,
      });
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Registration failed",
      };
    }
  },

  logout: async (): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message || error.message || "Logout failed",
      };
    }
  },

  setPassword: async ({
    password,
    confirmPassword,
  }: {
    password: string;
    confirmPassword: string;
  }): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.SET_PASSWORD, {
        password,
        confirmPassword,
      });
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Password update failed",
      };
    }
  },

  forgotPassword: async ({
    email,
  }: {
    email: string;
  }): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        { email }
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to forgot password",
      };
    }
  },

  getProfile: async (): Promise<ApiResponse> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.GET_PROFILE);
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to get profile",
      };
    }
  },
};

// Patient API
export const patientsApi = {
  getPatients: async (params?: any): Promise<ApiResponse> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PATIENTS.LIST, {
        params,
      });
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch patients",
      };
    }
  },

  createPatient: async (patientData: any): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.PATIENTS.CREATE,
        patientData
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to create patient",
      };
    }
  },

  getPatientById: async (id: string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.get(
        getEndpoint(API_ENDPOINTS.PATIENTS.GET_BY_ID, id)
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch patient",
      };
    }
  },
};

export const miscApi = {
  getMenu: async (): Promise<ApiResponse> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.MISC.GET_MENU);
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch menu",
      };
    }
  },

  getConstants: async (): Promise<ApiResponse> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.MISC.GET_CONSTANTS);
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch constants",
      };
    }
  },
};

// Doctors API
export const doctorsApi = {
  getDoctors: async (): Promise<ApiResponse> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.DOCTOR.DOCTORS.LIST);
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch doctors",
      };
    }
  },

  getPatients: async (params?: any): Promise<ApiResponse> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.DOCTOR.PATIENTS.LIST, {
        params,
      });
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch patients",
      };
    }
  },

  createPatient: async (patientData: any): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.DOCTOR.PATIENTS.CREATE,
        patientData
      );
      return response.data;
    } catch (error: any) {
      // Return the error response data if available (includes validation errors)
      // The backend returns { data: { errors: [...] }, error: true, message: "..." }
      if (error.response?.data) {
        return error.response.data;
      }
      // Fallback for network errors or other cases
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to create patient",
      };
    }
  },

  uploadMedicalRecords: async ({
    patientId,
    files,
    metadata,
    onUploadProgress,
  }: {
    patientId: string;
    files: File[];
    metadata?: { title?: string; type?: string };
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  }): Promise<ApiResponse<UploadMedicalRecordsResponse>> => {
    try {
      const formData = new FormData();

      for (const file of files) {
        formData.append("files", file);
      }

      if (metadata?.title) {
        formData.append("title", metadata.title);
      }
      if (metadata?.type) {
        formData.append("type", metadata.type);
      }

      const config: AxiosRequestConfig = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress,
      };

      const response = await apiClient.post(
        getEndpoint(API_ENDPOINTS.DOCTOR.PATIENTS.MEDICAL_RECORDS, patientId),
        formData,
        config
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to upload medical records",
      };
    }
  },

  getPatientById: async (id: string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.get(
        getEndpoint(API_ENDPOINTS.DOCTOR.PATIENTS.GET_BY_ID, id)
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch patient",
      };
    }
  },

  getPatientSummary: async (id: string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.get(
        getEndpoint(API_ENDPOINTS.DOCTOR.PATIENTS.SUMMARY, id),
        {
          timeout: 60000, // AI summary generation can take longer on first load
        }
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch patient summary",
      };
    }
  },

  getPatientMedications: async (
    patientId: string
  ): Promise<ApiResponse<PatientMedication[]>> => {
    try {
      const response = await apiClient.get(
        getEndpoint(API_ENDPOINTS.DOCTOR.PATIENTS.MEDICATIONS.LIST, patientId)
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch patient medications",
      };
    }
  },

  createPatientMedication: async (
    patientId: string,
    payload: CreatePatientMedicationPayload
  ): Promise<ApiResponse<PatientMedication>> => {
    try {
      const response = await apiClient.post(
        getEndpoint(API_ENDPOINTS.DOCTOR.PATIENTS.MEDICATIONS.LIST, patientId),
        payload
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to create medication",
      };
    }
  },

  updatePatientMedication: async (
    patientId: string,
    medicationId: string,
    payload: CreatePatientMedicationPayload
  ): Promise<ApiResponse<PatientMedication>> => {
    try {
      const response = await apiClient.put(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.PATIENTS.MEDICATIONS.DETAIL,
          patientId,
          medicationId
        ),
        payload
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to update medication",
      };
    }
  },

  deletePatientMedication: async (
    patientId: string,
    medicationId: string
  ): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.PATIENTS.MEDICATIONS.DETAIL,
          patientId,
          medicationId
        )
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete medication",
      };
    }
  },

  getPatientConversations: async (
    patientId: string
  ): Promise<ApiResponse<PatientChatConversation[]>> => {
    try {
      const response = await apiClient.get(
        getEndpoint(API_ENDPOINTS.DOCTOR.CHAT.PATIENT.CONVERSATIONS, patientId)
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch patient conversations",
      };
    }
  },

  getAllPatientConversations: async (): Promise<
    ApiResponse<PatientChatConversation[]>
  > => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.DOCTOR.CHAT.PATIENT.ALL_CONVERSATIONS
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch patient conversations",
      };
    }
  },

  createPatientConversation: async (
    patientId: string,
    chatType?: string
  ): Promise<ApiResponse<PatientChatConversation>> => {
    try {
      const response = await apiClient.post(
        getEndpoint(API_ENDPOINTS.DOCTOR.CHAT.PATIENT.CONVERSATIONS, patientId),
        chatType ? { chatType } : {},
        {
          timeout: 60000, // AI summary generation can take longer on first load
        }
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to create patient conversation",
      };
    }
  },

  getPatientConversationMessages: async (
    patientId: string,
    conversationId: string
  ): Promise<ApiResponse<ChatMessage[]>> => {
    try {
      const response = await apiClient.get(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.CHAT.PATIENT.CONVERSATION_MESSAGES,
          patientId,
          conversationId
        )
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch conversation messages",
      };
    }
  },

  sendPatientConversationMessage: async (
    patientId: string,
    conversationId: string,
    message: string
  ): Promise<ApiResponse<SendChatMessageResponse>> => {
    try {
      const response = await apiClient.post(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.CHAT.PATIENT.CONVERSATION_MESSAGES,
          patientId,
          conversationId
        ),
        {
          message,
        },
        {
          timeout: 60000, // AI summary generation can take longer on first load
        }
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to send message",
      };
    }
  },

  updatePatientConversationTitle: async (
    patientId: string,
    conversationId: string,
    title: string
  ): Promise<ApiResponse<PatientChatConversation>> => {
    try {
      const response = await apiClient.patch(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.CHAT.PATIENT.UPDATE_TITLE,
          patientId,
          conversationId
        ),
        { title }
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to update conversation title",
      };
    }
  },

  deletePatientConversation: async (
    patientId: string,
    conversationId: string
  ): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.CHAT.PATIENT.DELETE,
          patientId,
          conversationId
        )
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete conversation",
      };
    }
  },

  getGeneralConversations: async (): Promise<
    ApiResponse<GeneralChatConversation[]>
  > => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.DOCTOR.CHAT.GENERAL.CONVERSATIONS
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch conversations",
      };
    }
  },

  createGeneralConversation: async (payload?: {
    title?: string;
  }): Promise<ApiResponse<GeneralChatConversation>> => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.DOCTOR.CHAT.GENERAL.CONVERSATIONS,
        payload ?? {},
        {
          timeout: 60000, // AI summary generation can take longer on first load
        }
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to create conversation",
      };
    }
  },

  getGeneralConversationMessages: async (
    conversationId: string
  ): Promise<ApiResponse<ChatMessage[]>> => {
    try {
      const response = await apiClient.get(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.CHAT.GENERAL.CONVERSATION_MESSAGES,
          conversationId
        )
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch conversation messages",
      };
    }
  },

  sendGeneralConversationMessage: async (
    conversationId: string,
    message: string
  ): Promise<ApiResponse<SendChatMessageResponse>> => {
    try {
      const response = await apiClient.post(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.CHAT.GENERAL.CONVERSATION_MESSAGES,
          conversationId
        ),
        { message },
        {
          timeout: 60000, // AI summary generation can take longer on first load
        }
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to send message",
      };
    }
  },

  updateGeneralConversationTitle: async (
    conversationId: string,
    title: string
  ): Promise<ApiResponse<GeneralChatConversation>> => {
    try {
      const response = await apiClient.patch(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.CHAT.GENERAL.UPDATE_TITLE,
          conversationId
        ),
        { title },
        {
          timeout: 60000, // AI summary generation can take longer on first load
        }
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to update conversation title",
      };
    }
  },

  // AI Assistant specific APIs (simplified, no patientId, no chatType)
  createAiAssistantConversation: async (): Promise<
    ApiResponse<GeneralChatConversation>
  > => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.DOCTOR.CHAT.AI_ASSISTANT.CONVERSATIONS,
        {},
        {
          timeout: 60000, // AI summary generation can take longer on first load
        }
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to create conversation",
      };
    }
  },

  sendAiAssistantConversationMessage: async (
    conversationId: string,
    message: string
  ): Promise<ApiResponse<SendChatMessageResponse>> => {
    try {
      const response = await apiClient.post(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.CHAT.AI_ASSISTANT.CONVERSATION_MESSAGES,
          conversationId
        ),
        { message },
        {
          timeout: 60000, // AI summary generation can take longer on first load
        }
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to send message",
      };
    }
  },

  // Genetics/DNA endpoints
  getPatientGenetics: async (
    patientId: string
  ): Promise<ApiResponse<PatientDNAResult[]>> => {
    try {
      const response = await apiClient.get(
        getEndpoint(API_ENDPOINTS.DOCTOR.PATIENTS.GENETICS, patientId)
      );
      return response.data;
    } catch (error: unknown) {
      return {
        data: null,
        error: true,
        message: getApiErrorMessage(error, "Failed to fetch patient genetics"),
      };
    }
  },

  getPatientGeneticsReports: async (
    patientId: string
  ): Promise<ApiResponse<PatientGeneticsReport[]>> => {
    try {
      const endpoint = getEndpoint(
        API_ENDPOINTS.DOCTOR.PATIENTS.GENETICS_REPORTS,
        patientId
      );
      console.log("Fetching genetics reports from:", endpoint);
      const response = await apiClient.get(endpoint);
      console.log("Genetics reports response:", response.data);
      return response.data;
    } catch (error: unknown) {
      console.error("Error fetching genetics reports:", error);
      return {
        data: null,
        error: true,
        message: getApiErrorMessage(
          error,
          "Failed to fetch patient genetics reports"
        ),
      };
    }
  },

  updateDnaKitStatus: async (
    patientId: string,
    dnaResultId: string,
    action: "HOLD" | "PROCESS" | "CANCEL"
  ): Promise<ApiResponse<PatientDNAResult>> => {
    try {
      const response = await apiClient.post(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.PATIENTS.UPDATE_GENETICS_STATUS,
          patientId,
          dnaResultId
        ),
        { action }
      );
      return response.data;
    } catch (error: unknown) {
      if (
        isAxiosError<ApiResponse<PatientDNAResult>>(error) &&
        error.response?.data
      ) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message: getApiErrorMessage(error, "Failed to update DNA kit status"),
      };
    }
  },

  orderDNAKit: async (
    patientId: string,
    data: {
      barcode: string;
      reportId: string;
      orderType: string;
      addressId?: string;
    }
  ): Promise<ApiResponse<OrderDNAKitResponseData>> => {
    try {
      const response = await apiClient.post(
        getEndpoint(API_ENDPOINTS.DOCTOR.PATIENTS.LAB_ORDERS, patientId),
        data
      );
      return response.data;
    } catch (error: unknown) {
      if (
        isAxiosError<ApiResponse<OrderDNAKitResponseData>>(error) &&
        error.response?.data
      ) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message: getApiErrorMessage(error, "Failed to order DNA kit"),
      };
    }
  },

  // Reports endpoints
  getReports: async (params?: {
    gender?: string;
  }): Promise<ApiResponse<Report[]>> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.DOCTOR.REPORTS.LIST, {
        params,
      });
      return response.data;
    } catch (error: unknown) {
      return {
        data: null,
        error: true,
        message: getApiErrorMessage(error, "Failed to fetch reports"),
      };
    }
  },

  createReport: async (data: CreateReportDto): Promise<ApiResponse<Report>> => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.DOCTOR.REPORTS.CREATE,
        data
      );
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError<ApiResponse<Report>>(error) && error.response?.data) {
        return error.response.data;
      }

      return {
        data: null,
        error: true,
        message: getApiErrorMessage(error, "Failed to create report"),
      };
    }
  },

  // Patient Address endpoints
  getPatientAddresses: async (
    patientId: string
  ): Promise<ApiResponse<PatientAddress[]>> => {
    try {
      const response = await apiClient.get(
        getEndpoint(API_ENDPOINTS.DOCTOR.PATIENTS.ADDRESSES.LIST, patientId)
      );
      return response.data;
    } catch (error: unknown) {
      return {
        data: null,
        error: true,
        message: getApiErrorMessage(error, "Failed to fetch patient addresses"),
      };
    }
  },

  createPatientAddress: async (
    patientId: string,
    data: {
      address: PatientAddressDetails;
      isPrimary?: boolean;
    }
  ): Promise<ApiResponse<PatientAddress>> => {
    try {
      const response = await apiClient.post(
        getEndpoint(API_ENDPOINTS.DOCTOR.PATIENTS.ADDRESSES.CREATE, patientId),
        data
      );
      return response.data;
    } catch (error: unknown) {
      if (
        isAxiosError<ApiResponse<PatientAddress>>(error) &&
        error.response?.data
      ) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message: getApiErrorMessage(error, "Failed to create patient address"),
      };
    }
  },

  updatePatientAddress: async (
    patientId: string,
    addressId: string,
    data: {
      address?: PatientAddressDetails;
      isPrimary?: boolean;
    }
  ): Promise<ApiResponse<PatientAddress>> => {
    try {
      const response = await apiClient.put(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.PATIENTS.ADDRESSES.UPDATE,
          patientId,
          addressId
        ),
        data
      );
      return response.data;
    } catch (error: unknown) {
      if (
        isAxiosError<ApiResponse<PatientAddress>>(error) &&
        error.response?.data
      ) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message: getApiErrorMessage(error, "Failed to update patient address"),
      };
    }
  },

  // Patient Info Update
  updatePatientInfo: async (
    patientId: string,
    data: {
      weight?: number;
      height?: number;
      dateOfBirth?: string;
      gender?: string;
      bloodType?: string;
      clinicalData?: Record<string, any>;
      lifestyleData?: Record<string, any>;
      medicationsData?: Record<string, any>;
    }
  ): Promise<ApiResponse> => {
    try {
      const response = await apiClient.put(
        getEndpoint(API_ENDPOINTS.DOCTOR.PATIENTS.UPDATE_INFO, patientId),
        data
      );
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError<ApiResponse>(error) && error.response?.data) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message: getApiErrorMessage(error, "Failed to update patient info"),
      };
    }
  },

  // Dosing Calculation APIs
  calculateTestosteroneDosing: async (
    patientId: string,
    pelletType: "T100" | "T200"
  ): Promise<ApiResponse<TestosteroneDosingSuggestionsResponse>> => {
    try {
      const response = await apiClient.post<
        ApiResponse<TestosteroneDosingSuggestionsResponse>
      >(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.PATIENTS.DOSING.CALCULATE_TESTOSTERONE,
          patientId
        ),
        { pelletType }
      );
      return response.data;
    } catch (error: unknown) {
      if (
        isAxiosError<ApiResponse<TestosteroneDosingSuggestionsResponse>>(
          error
        ) &&
        error.response?.data
      ) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message: getApiErrorMessage(
          error,
          "Failed to calculate testosterone dosing"
        ),
      };
    }
  },

  calculateEstradiolDosing: async (
    patientId: string
  ): Promise<ApiResponse<EstradiolDosingSuggestionsResponse>> => {
    try {
      const response = await apiClient.post<
        ApiResponse<EstradiolDosingSuggestionsResponse>
      >(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.PATIENTS.DOSING.CALCULATE_ESTRADIOL,
          patientId
        )
      );
      return response.data;
    } catch (error: unknown) {
      if (
        isAxiosError<ApiResponse<EstradiolDosingSuggestionsResponse>>(error) &&
        error.response?.data
      ) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message: getApiErrorMessage(
          error,
          "Failed to calculate estradiol dosing"
        ),
      };
    }
  },

  saveDosingCalculation: async (
    patientId: string,
    data: SaveDosingCalculationRequest
  ): Promise<ApiResponse<boolean>> => {
    try {
      const response = await apiClient.post<ApiResponse<boolean>>(
        getEndpoint(API_ENDPOINTS.DOCTOR.PATIENTS.DOSING.SAVE, patientId),
        data
      );
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError<ApiResponse<boolean>>(error) && error.response?.data) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message: getApiErrorMessage(error, "Failed to save dosing calculation"),
      };
    }
  },

  // Get Dosing History using Post API
  getDosingHistoryPostApi: async (
    patientId: string,
    gender: string
  ): Promise<any> => {
    try {
      const normalizedGender = gender?.toLowerCase() || "";
      
      if (!normalizedGender) {
        return {
          data: null,
          error: true,
          message: "Patient gender is required to fetch dosing history",
        };
      }

      if (normalizedGender === "male") {
        const [result100, result200] = await Promise.allSettled([
          doctorsApi.calculateTestosteroneDosing(patientId, "T100"),
          doctorsApi.calculateTestosteroneDosing(patientId, "T200"),
        ]);
        const t100 = result100.status === "fulfilled" ? result100.value : null;
        const t200 = result200.status === "fulfilled" ? result200.value : null;
        const result = {
          data: [
            {
              data: {
                T100: { dosingSuggestions: t100?.data || {} },
              },
              type: "T100",
            },
            {
              data: {
                T200: { dosingSuggestions: t200?.data || {} },
              },
              type: "T200",
            },
          ],
          error: false,
          message: "Dosing history fetched successfully",
        };
        return result;
      } else if (normalizedGender === "female") {
        const [result100, estradiol] = await Promise.allSettled([
          doctorsApi.calculateTestosteroneDosing(patientId, "T100"),
          doctorsApi.calculateEstradiolDosing(patientId),
        ]);
        const t100 = result100.status === "fulfilled" ? result100.value : null;
        const estradiolRes =
          estradiol.status === "fulfilled" ? estradiol.value : null;

        const result = {
          data: [
            {
              data: {
                ESTRADIOL: { dosingSuggestions: estradiolRes?.data || {} },
              },
              type: "ESTRADIOL",
            },
            {
              data: {
                T100: { dosingSuggestions: t100?.data || {} },
              },
              type: "T100",
            },
          ],
          error: false,
          message: "Dosing history fetched successfully",
        };
        return result;
      } else {
        return {
          data: null,
          error: true,
          message: `Invalid gender value: ${gender}. Expected 'male' or 'female'.`,
        };
      }
    } catch (error: unknown) {
      return {
        data: null,
        error: true,
        message: getApiErrorMessage(error, "Failed to fetch dosing history"),
      };
    }
  },

  getDosingHistory: async (
    patientId: string
  ): Promise<ApiResponse<DosingHistoryResponse>> => {
    try {
      const response = await apiClient.get(
        getEndpoint(API_ENDPOINTS.DOCTOR.PATIENTS.DOSING.GET_HISTORY, patientId)
      );
      return response.data;
    } catch (error: unknown) {
      if (
        isAxiosError<ApiResponse<DosingHistoryResponse>>(error) &&
        error.response?.data
      ) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message: getApiErrorMessage(error, "Failed to fetch dosing history"),
      };
    }
  },

  // Health Goal APIs
  getPatientGoals: async (
    patientId: string
  ): Promise<ApiResponse<{ goals: PatientGoal[] }>> => {
    try {
      const response = await apiClient.get(
        getEndpoint(API_ENDPOINTS.DOCTOR.PATIENTS.GOALS, patientId)
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch patient goals",
      };
    }
  },

  createPatientGoal: async (
    patientId: string,
    payload: { description: string; notes?: string }
  ) => {
    try {
      const response = await apiClient.post(
        getEndpoint(API_ENDPOINTS.DOCTOR.PATIENTS.GOALS, patientId),
        payload
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to create goal",
      };
    }
  },

  updatePatientGoal: async (
    patientId: string,
    goalId: string,
    payload: { description: string; notes?: string }
  ) => {
    try {
      const response = await apiClient.put(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.PATIENTS.GOALS_DETAIL,
          patientId,
          goalId
        ),
        payload
      );
      return response.data;
    } catch (error: any) {
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to update goal",
      };
    }
  },

  deletePatientGoal: async (
    patientId: string,
    goalId: string
  ): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.PATIENTS.GOALS_DETAIL,
          patientId,
          goalId
        )
      );
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError<ApiResponse<null>>(error) && error.response?.data) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message: getApiErrorMessage(error, "Failed to delete goal"),
      };
    }
  },

  // Patient Alert APIs
  createPatientAlert: async (
    patientId: string,
    data: {
      description: string;
      severity: string;
      notes?: string;
    }
  ): Promise<ApiResponse<PatientAlert>> => {
    try {
      const response = await apiClient.post(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.PATIENTS.ALERTS.CREATE,
          patientId,
          "alert"
        ),
        data
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to create alert",
      };
    }
  },

  // Patient Allergy APIs
  createPatientAllergy: async (
    patientId: string,
    data: {
      allergen: string;
      reactionType: string;
      notes?: string;
    }
  ): Promise<ApiResponse<PatientAllergy>> => {
    try {
      const response = await apiClient.post(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.PATIENTS.ALERTS.CREATE,
          patientId,
          "allergy"
        ),
        data
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to create allergy",
      };
    }
  },

  updatePatientAlert: async (
    patientId: string,
    alertId: string,
    data: {
      description?: string;
      severity?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<PatientAlert>> => {
    try {
      const response = await apiClient.put(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.PATIENTS.ALERTS.UPDATE,
          patientId,
          alertId,
          "alert"
        ),
        data
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to update alert",
      };
    }
  },

  updatePatientAllergy: async (
    patientId: string,
    allergyId: string,
    data: {
      allergen?: string;
      reactionType?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<PatientAllergy>> => {
    try {
      const response = await apiClient.put(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.PATIENTS.ALERTS.UPDATE,
          patientId,
          allergyId,
          "allergy"
        ),
        data
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to update allergy",
      };
    }
  },

  deletePatientAlert: async (
    patientId: string,
    alertId: string
  ): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.PATIENTS.ALERTS.DELETE,
          patientId,
          alertId,
          "alert"
        )
      );
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError<ApiResponse<null>>(error) && error.response?.data) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message: getApiErrorMessage(error, "Failed to delete alert"),
      };
    }
  },

  deletePatientAllergy: async (
    patientId: string,
    allergyId: string
  ): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete(
        getEndpoint(
          API_ENDPOINTS.DOCTOR.PATIENTS.ALERTS.DELETE,
          patientId,
          allergyId,
          "allergy"
        )
      );
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError<ApiResponse<null>>(error) && error.response?.data) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message: getApiErrorMessage(error, "Failed to delete allergy"),
      };
    }
  },

  // Patient Chart Notes APIs
  createPatientChartNote: async (
    patientId: string,
    data: {
      title?: string;
      content: string;
    }
  ): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post(
        getEndpoint(API_ENDPOINTS.DOCTOR.PATIENTS.CHART_NOTES.CREATE, patientId),
        data
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        data: null,
        error: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to create chart note",
      };
    }
  },
};

export const api = {
  auth: authApi,
  patients: patientsApi,
  misc: miscApi,
};
