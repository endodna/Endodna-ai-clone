import { ApiResponse, doctorsApi } from "@/handlers/api/api";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { PatientsApiResponse } from "@/types/patient";
import { queryKeys } from "@/components/constants/QueryKeys";

interface GetDoctorPatientsParams {
    page?: number;
    limit?: number;
    search?: string;
}

/** 
 * Hook for fetching doctor's patients list
 */
export const useDoctorPatients = (
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
}