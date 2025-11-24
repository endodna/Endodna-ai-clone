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
      summary: (id: string) => [...queryKeys.doctor.patients.all(), "summary", id] as const,
      medications: (id: string) => [...queryKeys.doctor.patients.all(), "medications", id] as const,
      create: (patientData: AddPatientData) => [...queryKeys.doctor.patients.all(), "create", patientData] as const,
    },
    chat: {
      all: () => [...queryKeys.doctor.all, "chat"] as const,
      patient: {
        all: () => [...queryKeys.doctor.chat.all(), "patient"] as const,
        conversations: (patientId: string) => [...queryKeys.doctor.chat.patient.all(), "conversations", patientId] as const,
        conversationMessages: (patientId: string, conversationId: string) =>
          [...queryKeys.doctor.chat.patient.all(), "messages", patientId, conversationId] as const,
        allPatients: () => [...queryKeys.doctor.chat.patient.all(), "all-patients"] as const,
      },
      general: {
        all: () => [...queryKeys.doctor.chat.all(), "general"] as const,
        conversations: () => [...queryKeys.doctor.chat.general.all(), "conversations"] as const,
        conversationMessages: (conversationId: string) =>
          [...queryKeys.doctor.chat.general.all(), "messages", conversationId] as const,
      },
    },
    dna: {
      all: () => [...queryKeys.doctor.all, "dna"] as const,
      results: (patientId: string) => [...queryKeys.doctor.dna.all(), "results", patientId] as const,
      reports: (gender: string | null | undefined) =>
        [...queryKeys.doctor.dna.all(), "reports", gender ?? "ALL"] as const,
      addresses: (patientId: string) => [...queryKeys.doctor.dna.all(), "addresses", patientId] as const,
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