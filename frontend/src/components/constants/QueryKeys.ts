// Query keys factory for centralized query key management
export const queryKeys = {
  doctor: {
    all: ["doctor"] as const,
    doctors: {
      all: () => [...queryKeys.doctor.all, "doctors"] as const,
      lists: () => [...queryKeys.doctor.doctors.all(), "list"] as const,
      list: () => [...queryKeys.doctor.doctors.lists()] as const,
    },
    patients: {
      all: () => [...queryKeys.doctor.all, "patients"] as const,
      lists: () => [...queryKeys.doctor.patients.all(), "list"] as const,
      list: (params?: { page?: number; limit?: number; search?: string; doctorId?: string; status?: string }) =>
        [...queryKeys.doctor.patients.lists(), params] as const,
      detail: (id: string) => [...queryKeys.doctor.patients.all(), "detail", id] as const,
      create: (patientData: AddPatientData) => [...queryKeys.doctor.patients.all(), "create", patientData] as const,
    },
  },
  misc: {
    all: ["misc"] as const,
    constants: {
      all: () => [...queryKeys.misc.all, "constants"] as const,
      list: () => [...queryKeys.misc.constants.all()] as const,
    },
  },
} as const;