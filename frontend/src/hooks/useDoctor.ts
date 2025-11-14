import { ApiResponse, doctorsApi, miscApi } from "@/handlers/api/api";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/components/constants/QueryKeys";


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