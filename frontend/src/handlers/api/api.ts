import apiClient from '../../lib/apiClient'
import { API_ENDPOINTS, getEndpoint } from './endpoints'

export interface ApiResponse<T = any> {
  data: T
  error: boolean
  message: string
}

// Authentication API
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password })
    return response.data
  },

  register: async (email: string, password: string): Promise<ApiResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, { email, password })
    return response.data
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
    return response.data
  },
}

// Patient API
export const patientsApi = {
  getPatients: async (params?: any): Promise<ApiResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.PATIENTS.LIST, { params })
    return response.data
  },

  createPatient: async (patientData: any): Promise<ApiResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.PATIENTS.CREATE, patientData)
    return response.data
  },

  getPatientById: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.get(getEndpoint(API_ENDPOINTS.PATIENTS.GET_BY_ID, id))
    return response.data
  }
}

export const miscApi = {
  getMenu: async (): Promise<ApiResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.MISC.GET_MENU)
    return response.data
  }
}

export const api = {
  auth: authApi,
  patients: patientsApi,
  misc: miscApi,
}

export { apiClient }
