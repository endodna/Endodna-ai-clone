import { queryKeys } from "@/components/constants/QueryKeys";
import { ApiResponse, doctorsApi, miscApi } from "@/handlers/api/api";
import { AddPatientFormData } from "@/schemas/patient.schema";
import { useMutation, UseMutationOptions, useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { AxiosProgressEvent } from "axios";


interface UploadMedicalRecordsVariables {
    patientId: string;
    files: File[];
    metadata?: {
        title?: string;
        type?: string;
    };
    onUploadProgress?: (event: AxiosProgressEvent) => void;
}

/** 
 * Hook for fetching doctor's patients list
 */
export const useGetDoctorPatients = (
    params?: GetDoctorPatientsParams,
    options?: Omit<UseQueryOptions<ApiResponse<PatientsApiResponse>, Error>, "queryKey" | "queryFn">
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
    options?: Omit<UseQueryOptions<ApiResponse<Doctor[]>, Error>, "queryKey" | "queryFn">
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
    options?: Omit<UseQueryOptions<ApiResponse<Constants>, Error>, "queryKey" | "queryFn">
) => {
    return useQuery<ApiResponse<Constants>, Error>({
        queryKey: queryKeys.misc.constants.list(),
        queryFn: () => miscApi.getConstants(),
        placeholderData: (previousData) => previousData,
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes since constants don't change often
        ...options,
    });
};

/**
 * Hook for creating a new patient
 */
export const useCreatePatient = (
    options?: Omit<UseMutationOptions<ApiResponse<PatientAddedResponse>, Error, AddPatientFormData>, "mutationFn">
) => {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<PatientAddedResponse>, Error, AddPatientFormData>({
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
    options?: Omit<UseMutationOptions<ApiResponse<UploadMedicalRecordsResponse>, Error, UploadMedicalRecordsVariables>, "mutationFn">
) => {
    return useMutation<ApiResponse<UploadMedicalRecordsResponse>, Error, UploadMedicalRecordsVariables>({
        mutationFn: ({ patientId, files, metadata, onUploadProgress }) =>
            doctorsApi.uploadMedicalRecords({ patientId, files, metadata, onUploadProgress }),
        ...options,
    });
};

/**
 * Hook for fetching patient details by ID
 */
export const useGetPatientById = (
    patientId: string,
    options?: Omit<UseQueryOptions<ApiResponse<PatientDetail>, Error>, "queryKey" | "queryFn">
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