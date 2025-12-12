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
      GENETICS: (id: string) => `/doctor/patients/${id}/genetics`,
      GENETICS_REPORTS: (id: string) =>
        `/doctor/patients/${id}/genetics/reports`,
      UPDATE_GENETICS_STATUS: (patientId: string, dnaResultId: string) =>
        `/doctor/patients/${patientId}/genetics/${dnaResultId}`,
      LAB_ORDERS: (id: string) => `/doctor/patients/${id}/lab-orders`,
      ADDRESSES: {
        LIST: (id: string) => `/doctor/patients/${id}/addresses`,
        CREATE: (id: string) => `/doctor/patients/${id}/addresses`,
        UPDATE: (patientId: string, addressId: string) =>
          `/doctor/patients/${patientId}/addresses/${addressId}`,
        DELETE: (patientId: string, addressId: string) =>
          `/doctor/patients/${patientId}/addresses/${addressId}`,
      },
      MEDICATIONS: {
        LIST: (id: string) => `/doctor/patients/${id}/medications`,
        DETAIL: (patientId: string, medicationId: string) =>
          `/doctor/patients/${patientId}/medications/${medicationId}`,
      },
      UPDATE_INFO: (id: string) => `/doctor/patients/${id}`,
      DOSING: {
        CALCULATE_TESTOSTERONE: (id: string) =>
          `/doctor/patients/${id}/dosing/testosterone`,
        CALCULATE_ESTRADIOL: (id: string) =>
          `/doctor/patients/${id}/dosing/estradiol`,
        SAVE: (id: string) => `/doctor/patients/${id}/dosing`,
        GET_HISTORY: (id: string) => `/doctor/patients/${id}/dosing`,
      },
      GOALS: (id: string) => `/doctor/patients/${id}/goals`,
      GOALS_DETAIL: (patientId: string, goalId: string) =>
        `/doctor/patients/${patientId}/goals/${goalId}`,
      ALERTS: {
        CREATE: (id: string, type: "alert" | "allergy" = "alert") =>
          `/doctor/patients/${id}/alerts/${type}`,
        LIST: (id: string) => `/doctor/patients/${id}/alerts`,
        UPDATE: (
          patientId: string,
          alertId: string,
          type: "alert" | "allergy"
        ) => `/doctor/patients/${patientId}/alerts/${alertId}/${type}`,
        DELETE: (
          patientId: string,
          alertId: string,
          type: "alert" | "allergy"
        ) => `/doctor/patients/${patientId}/alerts/${alertId}/${type}`,
      },
      CHART_NOTES: {
        CREATE: (id: string) => `/doctor/patients/${id}/chart-notes`,
        LIST: (id: string) => `/doctor/patients/${id}/chart-notes`,
        UPDATE: (patientId: string, chartNoteId: string) =>
          `/doctor/patients/${patientId}/chart-notes/${chartNoteId}`,
        DELETE: (patientId: string, chartNoteId: string) =>
          `/doctor/patients/${patientId}/chart-notes/${chartNoteId}`,
      },
    },
    REPORTS: {
      LIST: "/doctor/reports",
      CREATE: "/doctor/reports",
      UPDATE: (id: string) => `/doctor/reports/${id}`,
      DELETE: (id: string) => `/doctor/reports/${id}`,
    },
    CHAT: {
      PATIENT: {
        CONVERSATIONS: (patientId: string) =>
          `/doctor/patients/${patientId}/conversations`,
        CONVERSATION_MESSAGES: (patientId: string, conversationId: string) =>
          `/doctor/patients/${patientId}/conversations/${conversationId}/messages`,
        UPDATE_TITLE: (patientId: string, conversationId: string) =>
          `/doctor/patients/${patientId}/conversations/${conversationId}/title`,
        DELETE: (patientId: string, conversationId: string) =>
          `/doctor/patients/${patientId}/conversations/${conversationId}`,
        ALL_CONVERSATIONS: "/doctor/conversations/patients",
      },
      GENERAL: {
        CONVERSATIONS: "/doctor/conversations",
        CONVERSATION_MESSAGES: (conversationId: string) =>
          `/doctor/conversations/${conversationId}/messages`,
        UPDATE_TITLE: (conversationId: string) =>
          `/doctor/conversations/${conversationId}/title`,
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
