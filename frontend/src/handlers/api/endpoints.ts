export const API_ENDPOINTS = {
  AUTH: {
    LOGIN_TOKEN: "/auth/login/token",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    SET_PASSWORD: "/auth/set-password",
    FORGOT_PASSWORD: "/auth/forgot-password",
    GET_PROFILE: "/auth/profile",
  },

  MISC: {
    GET_MENU: "/misc/menu",
    GET_CONSTANTS: "/misc/constants",
  },

  PATIENTS: {
    LIST: "/patients",
    CREATE: "/patients",
    GET_BY_ID: (id: string) => `/patients/${id}`,
  },

  // Doctor role endpoints
  DOCTOR: {
    DOCTORS: {
      LIST: "/doctor/doctors",
    },
    PATIENTS: {
      LIST: "/doctor/patients",
      CREATE: "/doctor/patient",
      GET_BY_ID: (id: string) => `/doctor/patients/${id}`,
      MEDICAL_RECORDS: (id: string) => `/doctor/patients/${id}/medical-records`,
      SUMMARY: (id: string) => `/doctor/patients/${id}/summary`,
      MEDICATIONS: {
        LIST: (id: string) => `/doctor/patients/${id}/medications`,
        DETAIL: (patientId: string, medicationId: string) =>
          `/doctor/patients/${patientId}/medications/${medicationId}`,
      },
    },
  },
} as const;

export const getEndpoint = (
  endpoint: string | ((...args: any[]) => string),
  ...args: any[]
): string => {
  if (typeof endpoint === "function") {
    return endpoint(...args);
  }
  return endpoint;
};
