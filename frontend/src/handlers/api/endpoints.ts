export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
  },

  MISC: {
    GET_MENU: '/menu',
  },

  PATIENTS: {
    LIST: '/patients',
    CREATE: '/patients',
    GET_BY_ID: (id: string) => `/patients/${id}`,
  },
} as const

export const getEndpoint = (endpoint: string | ((...args: any[]) => string), ...args: any[]): string => {
  if (typeof endpoint === 'function') {
    return endpoint(...args)
  }
  return endpoint
}
