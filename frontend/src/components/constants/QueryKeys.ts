// Query keys factory for centralized query key management
export const queryKeys = {
  doctor: {
    all: ["doctor"] as const,
    patients: {
      all: () => [...queryKeys.doctor.all, "patients"] as const,
      lists: () => [...queryKeys.doctor.patients.all(), "list"] as const,
      list: (params?: { page?: number; limit?: number; search?: string }) =>
        [...queryKeys.doctor.patients.lists(), params] as const,
    },
  },
} as const;