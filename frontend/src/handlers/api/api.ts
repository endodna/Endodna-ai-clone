import apiClient from "../../lib/apiClient";
import { API_ENDPOINTS, getEndpoint } from "./endpoints";
import { AxiosRequestConfig, AxiosProgressEvent } from "axios";

export interface ApiResponse<T = any> {
  data: T | null;
  error: boolean;
  message: string;
}

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
        { email },
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
        patientData,
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
        getEndpoint(API_ENDPOINTS.PATIENTS.GET_BY_ID, id),
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
        patientData,
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
        config,
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
        getEndpoint(API_ENDPOINTS.DOCTOR.PATIENTS.GET_BY_ID, id),
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

export const api = {
  auth: authApi,
  patients: patientsApi,
  misc: miscApi,
};

