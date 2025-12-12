import { queryKeys } from "@/components/constants/QueryKeys";
import { ApiResponse, doctorsApi, miscApi } from "@/handlers/api/api";
import { supabase } from "@/lib/supabase";
import { AddPatientFormData } from "@/schemas/patient.schema";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";

/**
 * Hook for fetching doctor's patients list
 */
export const useGetDoctorPatients = (
  params?: GetDoctorPatientsParams,
  options?: Omit<
    UseQueryOptions<ApiResponse<PatientsApiResponse>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ApiResponse<PatientsApiResponse>, Error>({
    queryKey: queryKeys.doctor.patients.list(params),
    queryFn: () => doctorsApi.getPatients(params),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
};

/**
 * Hook for fetching list of doctors
 */
export const useGetDoctors = (
  options?: Omit<
    UseQueryOptions<ApiResponse<Doctor[]>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ApiResponse<Doctor[]>, Error>({
    queryKey: queryKeys.doctor.doctors.list(),
    queryFn: () => doctorsApi.getDoctors(),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
};

/**
 * Hook for fetching backend constants
 */
export const useGetConstants = (
  options?: Omit<
    UseQueryOptions<ApiResponse<Constants>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ApiResponse<Constants>, Error>({
    queryKey: queryKeys.misc.constants.list(),
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token)
        throw new Error("No valid session available");
      return miscApi.getConstants();
    },
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: (count, error: any) => {
      if (error?.response?.status === 401) return false;
      if (error?.message === "No valid session available") return false;
      return count < 2;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - matches ConstantsContext
    gcTime: Infinity, // Keep in cache forever - matches ConstantsContext
    ...options,
  });
};

/**
 * Hook for creating a new patient
 */
export const useCreatePatient = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<PatientAddedResponse>,
      Error,
      AddPatientFormData
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<PatientAddedResponse>,
    Error,
    AddPatientFormData
  >({
    mutationFn: async (patientData) => {
      const response = await doctorsApi.createPatient(patientData);
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({
        queryKey: queryKeys.doctor.patients.lists(),
      });
    },
    ...options,
  });
};

export const useUploadMedicalRecords = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<UploadMedicalRecordsResponse>,
      Error,
      UploadMedicalRecordsVariables
    >,
    "mutationFn"
  >
) => {
  return useMutation<
    ApiResponse<UploadMedicalRecordsResponse>,
    Error,
    UploadMedicalRecordsVariables
  >({
    mutationFn: ({ patientId, files, metadata, onUploadProgress }) =>
      doctorsApi.uploadMedicalRecords({
        patientId,
        files,
        metadata,
        onUploadProgress,
      }),
    ...options,
  });
};

/**
 * Hook for fetching patient details by ID
 */
export const useGetPatientById = (
  patientId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<PatientDetail>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ApiResponse<PatientDetail>, Error>({
    queryKey: queryKeys.doctor.patients.detail(patientId),
    queryFn: () => doctorsApi.getPatientById(patientId),
    enabled: !!patientId,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
};

/**
 * Hook for fetching patient summary by ID
 */
export const useGetPatientSummary = (
  patientId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<any>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ApiResponse<any>, Error>({
    queryKey: queryKeys.doctor.patients.summary(patientId),
    queryFn: () => doctorsApi.getPatientSummary(patientId),
    enabled: !!patientId,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
};

export const useGetPatientMedications = (
  patientId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<PatientMedication[]>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ApiResponse<PatientMedication[]>, Error>({
    queryKey: queryKeys.doctor.patients.medications(patientId),
    queryFn: () => doctorsApi.getPatientMedications(patientId),
    enabled: !!patientId,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
};

export const useCreatePatientMedication = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<PatientMedication>,
      Error,
      { patientId: string; payload: CreatePatientMedicationPayload }
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<PatientMedication>,
    Error,
    { patientId: string; payload: CreatePatientMedicationPayload }
  >({
    mutationFn: ({ patientId, payload }) =>
      doctorsApi.createPatientMedication(patientId, payload),
    onSuccess: (data, variables) => {
      if (!data.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.patients.medications(variables.patientId),
        });
      }
    },
    ...options,
  });
};

export const useUpdatePatientMedication = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<PatientMedication>,
      Error,
      {
        patientId: string;
        medicationId: string;
        payload: CreatePatientMedicationPayload;
      }
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<PatientMedication>,
    Error,
    {
      patientId: string;
      medicationId: string;
      payload: CreatePatientMedicationPayload;
    }
  >({
    mutationFn: ({ patientId, medicationId, payload }) =>
      doctorsApi.updatePatientMedication(patientId, medicationId, payload),
    onSuccess: (data, variables) => {
      if (!data.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.patients.medications(variables.patientId),
        });
      }
    },
    ...options,
  });
};

export const useDeletePatientMedication = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<null>,
      Error,
      { patientId: string; medicationId: string }
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<null>,
    Error,
    { patientId: string; medicationId: string }
  >({
    mutationFn: ({ patientId, medicationId }) =>
      doctorsApi.deletePatientMedication(patientId, medicationId),
    onSuccess: (data, variables) => {
      if (!data.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.patients.medications(variables.patientId),
        });
      }
    },
    ...options,
  });
};

/* Chat Hooks */

export const useGetPatientConversations = (
  patientId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<PatientChatConversation[]>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ApiResponse<PatientChatConversation[]>, Error>({
    queryKey: queryKeys.doctor.chat.patient.conversations(patientId),
    queryFn: () => doctorsApi.getPatientConversations(patientId),
    enabled: !!patientId,
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
};

export const useGetAllPatientConversations = (
  options?: Omit<
    UseQueryOptions<ApiResponse<PatientChatConversation[]>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ApiResponse<PatientChatConversation[]>, Error>({
    queryKey: queryKeys.doctor.chat.patient.allPatients(),
    queryFn: () => doctorsApi.getAllPatientConversations(),
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
};

export const useGetGeneralConversations = (
  options?: Omit<
    UseQueryOptions<ApiResponse<GeneralChatConversation[]>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ApiResponse<GeneralChatConversation[]>, Error>({
    queryKey: queryKeys.doctor.chat.general.conversations(),
    queryFn: () => doctorsApi.getGeneralConversations(),
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
};

export const useGetPatientConversationMessages = (
  patientId: string,
  conversationId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<ChatMessage[]>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ApiResponse<ChatMessage[]>, Error>({
    queryKey: queryKeys.doctor.chat.patient.conversationMessages(
      patientId,
      conversationId
    ),
    queryFn: () =>
      doctorsApi.getPatientConversationMessages(patientId, conversationId),
    enabled: !!patientId && !!conversationId,
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
};

export const useGetGeneralConversationMessages = (
  conversationId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<ChatMessage[]>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ApiResponse<ChatMessage[]>, Error>({
    queryKey:
      queryKeys.doctor.chat.general.conversationMessages(conversationId),
    queryFn: () => doctorsApi.getGeneralConversationMessages(conversationId),
    enabled: !!conversationId,
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
};

export const useCreatePatientConversation = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<PatientChatConversation>,
      Error,
      { patientId: string; chatType?: string }
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<PatientChatConversation>,
    Error,
    { patientId: string; chatType?: string }
  >({
    mutationFn: ({ patientId, chatType }) =>
      doctorsApi.createPatientConversation(patientId, chatType),
    onSuccess: (response, variables) => {
      if (!response.error) {
        // Invalidate patient-specific conversations
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.chat.patient.conversations(
            variables.patientId
          ),
        });
        // Invalidate all patient conversations (for sidebar)
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.chat.patient.allPatients(),
        });
      }
    },
    ...options,
  });
};

export const useSendPatientConversationMessage = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<SendChatMessageResponse>,
      Error,
      { patientId: string; conversationId: string; message: string }
    >,
    "mutationFn"
  >
) => {
  return useMutation<
    ApiResponse<SendChatMessageResponse>,
    Error,
    { patientId: string; conversationId: string; message: string }
  >({
    mutationFn: ({ patientId, conversationId, message }) =>
      doctorsApi.sendPatientConversationMessage(
        patientId,
        conversationId,
        message
      ),
    ...options,
  });
};

export const useUpdatePatientConversationTitle = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<PatientChatConversation>,
      Error,
      { patientId: string; conversationId: string; title: string }
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<PatientChatConversation>,
    Error,
    { patientId: string; conversationId: string; title: string }
  >({
    mutationFn: ({ patientId, conversationId, title }) =>
      doctorsApi.updatePatientConversationTitle(
        patientId,
        conversationId,
        title
      ),
    onSuccess: (response, variables) => {
      if (!response.error) {
        // Invalidate patient-specific conversations
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.chat.patient.conversations(
            variables.patientId
          ),
        });
        // Invalidate all patient conversations (for sidebar)
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.chat.patient.allPatients(),
        });
      }
    },
    ...options,
  });
};

export const useDeletePatientConversation = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<null>,
      Error,
      { patientId: string; conversationId: string }
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<null>,
    Error,
    { patientId: string; conversationId: string }
  >({
    mutationFn: ({ patientId, conversationId }) =>
      doctorsApi.deletePatientConversation(patientId, conversationId),
    onSuccess: (response, variables) => {
      if (!response.error) {
        // Invalidate patient-specific conversations
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.chat.patient.conversations(
            variables.patientId
          ),
        });
        // Invalidate all patient conversations (for sidebar)
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.chat.patient.allPatients(),
        });
        // Invalidate conversation messages if any
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.chat.patient.conversationMessages(
            variables.patientId,
            variables.conversationId
          ),
        });
      }
    },
    ...options,
  });
};

export const useCreateGeneralConversation = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<GeneralChatConversation>,
      Error,
      { title?: string } | void
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<GeneralChatConversation>,
    Error,
    { title?: string } | void
  >({
    mutationFn: (variables) =>
      doctorsApi.createGeneralConversation(variables ?? {}),
    onSuccess: (response) => {
      if (!response.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.chat.general.conversations(),
        });
      }
    },
    ...options,
  });
};

export const useSendGeneralConversationMessage = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<SendChatMessageResponse>,
      Error,
      { conversationId: string; message: string }
    >,
    "mutationFn"
  >
) => {
  return useMutation<
    ApiResponse<SendChatMessageResponse>,
    Error,
    { conversationId: string; message: string }
  >({
    mutationFn: ({ conversationId, message }) =>
      doctorsApi.sendGeneralConversationMessage(conversationId, message),
    ...options,
  });
};

export const useUpdateGeneralConversationTitle = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<GeneralChatConversation>,
      Error,
      { conversationId: string; title: string }
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<GeneralChatConversation>,
    Error,
    { conversationId: string; title: string }
  >({
    mutationFn: ({ conversationId, title }) =>
      doctorsApi.updateGeneralConversationTitle(conversationId, title),
    onSuccess: (response) => {
      if (!response.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.chat.general.conversations(),
        });
      }
    },
    ...options,
  });
};

// AI Assistant specific hooks (simplified APIs for AI Assistant page)
export const useCreateAiAssistantConversation = (
  options?: Omit<
    UseMutationOptions<ApiResponse<GeneralChatConversation>, Error, void>,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<GeneralChatConversation>, Error, void>({
    mutationFn: () => doctorsApi.createAiAssistantConversation(),
    onSuccess: (response) => {
      if (!response.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.chat.general.conversations(),
        });
      }
    },
    ...options,
  });
};

export const useSendAiAssistantConversationMessage = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<SendChatMessageResponse>,
      Error,
      { conversationId: string; message: string }
    >,
    "mutationFn"
  >
) => {
  return useMutation<
    ApiResponse<SendChatMessageResponse>,
    Error,
    { conversationId: string; message: string }
  >({
    mutationFn: ({ conversationId, message }) =>
      doctorsApi.sendAiAssistantConversationMessage(conversationId, message),
    ...options,
  });
};

// DNA/Genetics hooks
export const useGetPatientGenetics = (
  patientId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<PatientDNAResult[]>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ApiResponse<PatientDNAResult[]>, Error>({
    queryKey: queryKeys.doctor.dna.results(patientId),
    queryFn: () => doctorsApi.getPatientGenetics(patientId),
    enabled: Boolean(patientId),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
};

export const useGetPatientGeneticsReports = (
  patientId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<PatientGeneticsReport[]>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ApiResponse<PatientGeneticsReport[]>, Error>({
    queryKey: queryKeys.doctor.dna.geneticsReports(patientId),
    queryFn: () => doctorsApi.getPatientGeneticsReports(patientId),
    enabled: Boolean(patientId),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
};

export const useGetReports = (
  params?: { gender?: string },
  options?: Omit<
    UseQueryOptions<ApiResponse<Report[]>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  const gender = (params?.gender ?? "ALL").toUpperCase();
  const queryParams = { ...params, gender };
  return useQuery<ApiResponse<Report[]>, Error>({
    queryKey: queryKeys.doctor.dna.reports(gender),
    queryFn: () => doctorsApi.getReports(queryParams),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
};

export const useCreateReport = (
  options?: Omit<
    UseMutationOptions<ApiResponse<Report>, Error, CreateReportVariables>,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<Report>, Error, CreateReportVariables>({
    mutationFn: ({ data }) => doctorsApi.createReport(data),
    onSuccess: (response, variables) => {
      if (!response.error) {
        const createdGenders = (variables.data.genders ?? []).map((g) =>
          g.toUpperCase()
        );
        createdGenders.forEach((gender) => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.doctor.dna.reports(gender),
          });

          // queryClient.invalidateQueries({
          //   queryKey: queryKeys.doctor.dna.reports("ALL"),
          // });
        });
        return response;
      }
    },
    ...options,
  });
};

// Dosing Calculator Hooks
export const useUpdatePatientInfo = (
  options?: Omit<
    UseMutationOptions<ApiResponse, Error, { patientId: string; data: any }>,
    "mutationFn" | "onSuccess"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse, Error, { patientId: string; data: any }>({
    mutationFn: ({ patientId, data }) =>
      doctorsApi.updatePatientInfo(patientId, data),
    onSuccess: (_response, variables) => {
      // Invalidate patient detail query to update the patient profile page
      queryClient.invalidateQueries({
        queryKey: queryKeys.doctor.patients.detail(variables.patientId),
      });
      // Invalidate all patient list queries to update the patient table immediately
      queryClient.invalidateQueries({
        queryKey: queryKeys.doctor.patients.lists(),
      });
    },
    ...options,
  });
};

export const useCalculateTestosteroneDosing = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<TestosteroneDosingSuggestionsResponse>,
      Error,
      { patientId: string; pelletType: "T100" | "T200" }
    >,
    "mutationFn"
  >
) => {
  return useMutation<
    ApiResponse<TestosteroneDosingSuggestionsResponse>,
    Error,
    { patientId: string; pelletType: "T100" | "T200" }
  >({
    mutationFn: ({ patientId, pelletType }) =>
      doctorsApi.calculateTestosteroneDosing(patientId, pelletType),
    ...options,
  });
};

export const useCalculateEstradiolDosing = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<EstradiolDosingSuggestionsResponse>,
      Error,
      string
    >,
    "mutationFn"
  >
) => {
  return useMutation<
    ApiResponse<EstradiolDosingSuggestionsResponse>,
    Error,
    string
  >({
    mutationFn: (patientId) => doctorsApi.calculateEstradiolDosing(patientId),
    ...options,
  });
};

export const useSaveDosingCalculation = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<boolean>,
      Error,
      {
        patientId: string;
        data: SaveDosingCalculationRequest;
      }
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<boolean>,
    Error,
    {
      patientId: string;
      data: SaveDosingCalculationRequest;
    }
  >({
    mutationFn: ({ patientId, data }) =>
      doctorsApi.saveDosingCalculation(patientId, data),
    onSuccess: (_response, variables) => {
      // Invalidate queries on successful save
      queryClient.invalidateQueries({
        queryKey: queryKeys.doctor.dosing.history(variables.patientId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.doctor.patients.medications(variables.patientId),
      });
    },
    ...options,
  });
};

export const usePostDosingHistory = (
  patientId: string,
  gender: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<DosingHistoryResponse>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ApiResponse<DosingHistoryResponse>, Error>({
    queryKey: queryKeys.doctor.dosing.historyPost(patientId),
    // queryFn: () => doctorsApi.getDosingHistory(patientId),
    queryFn: () => doctorsApi.getDosingHistoryPostApi(patientId, gender),
    enabled: Boolean(patientId) && Boolean(gender),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
};

export const useGetDosingHistory = (
  patientId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<DosingHistoryResponse>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ApiResponse<DosingHistoryResponse>, Error>({
    queryKey: queryKeys.doctor.dosing.history(patientId),
    queryFn: () => doctorsApi.getDosingHistory(patientId),
    // queryFn: () => doctorsApi.getDosingHistoryPostApi(patientId, gender),
    enabled: Boolean(patientId),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
};

export const useOrderDNAKit = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<OrderDNAKitResponseData>,
      Error,
      OrderDNAKitVariables
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<OrderDNAKitResponseData>,
    Error,
    OrderDNAKitVariables
  >({
    mutationFn: ({ patientId, data }) =>
      doctorsApi.orderDNAKit(patientId, data),
    onSuccess: (response, variables) => {
      if (!response.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.dna.results(variables.patientId),
        });
      }
    },
    ...options,
  });
};

export const useUpdateDnaKitStatus = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<PatientDNAResult>,
      Error,
      {
        patientId: string;
        dnaResultId: string;
        action: "HOLD" | "PROCESS" | "CANCEL";
      }
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<PatientDNAResult>,
    Error,
    {
      patientId: string;
      dnaResultId: string;
      action: "HOLD" | "PROCESS" | "CANCEL";
    }
  >({
    mutationFn: ({ patientId, dnaResultId, action }) =>
      doctorsApi.updateDnaKitStatus(patientId, dnaResultId, action),
    onSuccess: (response, variables) => {
      if (!response.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.dna.results(variables.patientId),
        });
      }
    },
    ...options,
  });
};

// Patient Address hooks
export const useGetPatientAddresses = (
  patientId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<PatientAddress[]>, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ApiResponse<PatientAddress[]>, Error>({
    queryKey: queryKeys.doctor.dna.addresses(patientId),
    queryFn: () => doctorsApi.getPatientAddresses(patientId),
    enabled: Boolean(patientId),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
};

export const useCreatePatientAddress = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<PatientAddress>,
      Error,
      CreatePatientAddressVariables
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<PatientAddress>,
    Error,
    CreatePatientAddressVariables
  >({
    mutationFn: ({ patientId, data }) =>
      doctorsApi.createPatientAddress(patientId, data),
    onSuccess: (response, variables) => {
      if (!response.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.dna.addresses(variables.patientId),
        });
      }
    },
    ...options,
  });
};

export const useUpdatePatientAddress = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<PatientAddress>,
      Error,
      UpdatePatientAddressVariables
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<PatientAddress>,
    Error,
    UpdatePatientAddressVariables
  >({
    mutationFn: ({ patientId, addressId, data }) =>
      doctorsApi.updatePatientAddress(patientId, addressId, data),
    onSuccess: (response, variables) => {
      if (!response.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.dna.addresses(variables.patientId),
        });
      }
    },
    ...options,
  });
};

// Health Goal hooks

export const useGetPatientGoals = (patientId?: string) => {
  return useQuery<ApiResponse<{ goals: PatientGoal[] }>, Error>({
    queryKey: queryKeys.doctor.patients.goals.list(patientId ?? ""),
    queryFn: () => doctorsApi.getPatientGoals(patientId ?? ""),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: Boolean(patientId),
  });
};

export const useCreatePatientGoal = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<PatientGoal>,
      Error,
      CreatePatientHealthGoalsVariables
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<PatientGoal>,
    Error,
    CreatePatientHealthGoalsVariables
  >({
    mutationFn: ({ patientId, data }) =>
      doctorsApi.createPatientGoal(patientId, data),
    onSuccess: (response, variables) => {
      if (!response.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.patients.goals.list(variables.patientId),
        });
        return response;
      }
    },
    ...options,
  });
};

export const useUpdatePatientGoal = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<PatientGoal>,
      Error,
      UpdatePatientHealthGoalsVariables
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<PatientGoal>,
    Error,
    UpdatePatientHealthGoalsVariables
  >({
    mutationFn: ({ patientId, goalId, data }) =>
      doctorsApi.updatePatientGoal(patientId, goalId, data),
    onSuccess: (response, variables) => {
      if (!response.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.patients.goals.list(variables.patientId),
        });
        return response;
      }
    },
    ...options,
  });
};

export const useDeletePatientGoal = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<null>,
      Error,
      { patientId: string; goalId: string }
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<null>,
    Error,
    { patientId: string; goalId: string }
  >({
    mutationFn: ({ patientId, goalId }) =>
      doctorsApi.deletePatientGoal(patientId, goalId),
    onSuccess: (response, variables) => {
      if (!response.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.patients.goals.list(variables.patientId),
        });
        return response;
      }
    },
    ...options,
  });
};

// Patient Alert hooks
export const useCreatePatientAlert = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<PatientAlert>,
      Error,
      CreatePatientAlertVariables
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<PatientAlert>,
    Error,
    CreatePatientAlertVariables
  >({
    mutationFn: ({ patientId, data }) =>
      doctorsApi.createPatientAlert(patientId, data),
    onSuccess: (response, variables) => {
      if (!response.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.patients.detail(variables.patientId),
        });
        return response;
      }
    },
    ...options,
  });
};

// Patient Allergy hooks
export const useCreatePatientAllergy = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<PatientAllergy>,
      Error,
      CreatePatientAllergyVariables
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<PatientAllergy>,
    Error,
    CreatePatientAllergyVariables
  >({
    mutationFn: ({ patientId, data }) =>
      doctorsApi.createPatientAllergy(patientId, data),
    onSuccess: (response, variables) => {
      if (!response.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.patients.detail(variables.patientId),
        });
        return response;
      }
    },
    ...options,
  });
};

export const useCreatePatientChartNote = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<any>,
      Error,
      { patientId: string; payload: { title?: string; content: string } }
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<any>,
    Error,
    { patientId: string; payload: { title?: string; content: string } }
  >({
    mutationFn: ({ patientId, payload }) =>
      doctorsApi.createPatientChartNote(patientId, payload),
    onSuccess: (response, variables) => {
      if (!response.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.patients.detail(variables.patientId),
        });
        return response;
      }
    },
    ...options,
  });
};

export const useUpdatePatientAlert = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<PatientAlert>,
      Error,
      UpdatePatientAlertVariables
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<PatientAlert>,
    Error,
    UpdatePatientAlertVariables
  >({
    mutationFn: ({ patientId, alertId, data }) =>
      doctorsApi.updatePatientAlert(patientId, alertId, data),
    onSuccess: (response, variables) => {
      if (!response.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.patients.detail(variables.patientId),
        });
        return response;
      }
    },
    ...options,
  });
};

export const useUpdatePatientAllergy = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<PatientAllergy>,
      Error,
      UpdatePatientAllergyVariables
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<PatientAllergy>,
    Error,
    UpdatePatientAllergyVariables
  >({
    mutationFn: ({ patientId, allergyId, data }) =>
      doctorsApi.updatePatientAllergy(patientId, allergyId, data),
    onSuccess: (response, variables) => {
      if (!response.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.patients.detail(variables.patientId),
        });
        return response;
      }
    },
    ...options,
  });
};

export const useDeletePatientAlert = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<null>,
      Error,
      { patientId: string; alertId: string }
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<null>,
    Error,
    { patientId: string; alertId: string }
  >({
    mutationFn: ({ patientId, alertId }) =>
      doctorsApi.deletePatientAlert(patientId, alertId),
    onSuccess: (response, variables) => {
      if (!response.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.patients.detail(variables.patientId),
        });
        return response;
      }
    },
    ...options,
  });
};

export const useDeletePatientAllergy = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<null>,
      Error,
      { patientId: string; allergyId: string }
    >,
    "mutationFn"
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<null>,
    Error,
    { patientId: string; allergyId: string }
  >({
    mutationFn: ({ patientId, allergyId }) =>
      doctorsApi.deletePatientAllergy(patientId, allergyId),
    onSuccess: (response, variables) => {
      if (!response.error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctor.patients.detail(variables.patientId),
        });
        return response;
      }
    },
    ...options,
  });
};
