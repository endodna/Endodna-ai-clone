import { AddPatientDialog } from "@/components/patients/AddPatientDialog";
import { InvitePatientDialog } from "@/components/patients/InvitePatientDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useGetConstants, useGetDoctorPatients, useGetDoctors } from "@/hooks/useDoctor";
import debounce from "@/utils/utils";
import { Search, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PatientTable } from "../../components/patients/PatientTable";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeAddPatientDialog, openAddPatientDialog, openInvitePatientDialog } from "@/store/features/patient";

const DEFAULT_PHYSICIAN_VALUE = "all";
const DEFAULT_STATUS_VALUE = "all";
const DEFAULT_FILTERS = {
    searchInput: "",
    selectedPhysician: DEFAULT_PHYSICIAN_VALUE,
    selectedStatus: DEFAULT_STATUS_VALUE,
    page: 1,
    limit: 10,
};

export default function PatientListPage() {
    const dispatch = useAppDispatch();
    const { isAddPatientDialogOpen } = useAppSelector((state) => state.patientDialog);

    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [search, setSearch] = useState("");
    const { searchInput, selectedPhysician, selectedStatus, page, limit } = filters;

    // Fetch doctors and constants for filters
    const { data: doctorsResponse } = useGetDoctors();
    const { data: constantsResponse } = useGetConstants();

    const doctors = doctorsResponse?.data ?? [];
    const constants = constantsResponse?.data;

    const {
        data: apiResponse,
        isLoading,
        error,
        isRefetching,
        refetch,
    } = useGetDoctorPatients({
        page,
        limit,
        search: search || undefined,
        doctorId: selectedPhysician === DEFAULT_PHYSICIAN_VALUE ? undefined : selectedPhysician,
        status: selectedStatus === DEFAULT_STATUS_VALUE ? undefined : selectedStatus,
    });

    const patients: PatientRow[] = apiResponse?.data?.items ?? [];
    const pagination = apiResponse?.data?.pagination;

    let errorMessage: string | null = null;
    if (error) {
        errorMessage = (error as any)?.message ?? apiResponse?.message ?? "Failed to fetch patients";
    } else if (apiResponse?.error) {
        errorMessage = apiResponse.message;
    }

    // Debounced search handler
    const debouncedSetSearch = useMemo(
        () =>
            debounce((value: string) => {
                setSearch(value);
                setFilters((prev) => ({
                    ...prev,
                    page: 1,
                }));
            }, 300),
        [setFilters]
    );

    // Handle search input change
    const handleSearchChange = (value: string) => {
        setFilters((prev) => ({
            ...prev,
            searchInput: value,
        })); // Update input immediately
        debouncedSetSearch(value); // Trigger debounced API call
    };

    // Build physician options from fetched doctors
    const physicianOptions = useMemo(() => {
        const options = [{ value: DEFAULT_PHYSICIAN_VALUE, label: "All Physicians" }];
        if (doctors && doctors.length > 0) {
            for (const doctor of doctors) {
                const fullName = `${doctor.firstName} ${doctor.lastName}`.trim();
                options.push({
                    value: doctor.id,
                    label: fullName ?? doctor.email,
                });
            }
        }
        return options;
    }, [doctors]);

    // Build status options from fetched constants
    const statusOptions = useMemo(() => {
        const options = [{ value: DEFAULT_STATUS_VALUE, label: "All Statuses" }];
        if (constants) {
            // Add DNA result statuses
            if (constants.dnaResultStatus && constants.dnaResultStatus.length > 0) {
                for (const status of constants.dnaResultStatus) {
                    options.push({
                        value: status,
                        label: status,
                    });
                }
            }
        }
        return options;
    }, [constants]);

    // Handle pagination changes
    useEffect(() => {
        if (!pagination) return;

        if (pagination.totalPages === 0 && page !== 1) {
            setFilters((prev) => ({
                ...prev,
                page: 1,
            }));
            return;
        }

        if (pagination.totalPages > 0 && page > pagination.totalPages) {
            setFilters((prev) => ({
                ...prev,
                page: pagination.totalPages,
            }));
        }
    }, [pagination, page, setFilters]);

    return (
        <div className="space-y-6 flex flex-col h-full w-full">

            {/* Title and add new patient button */}
            <div className="flex items-center justify-between">
                <h1 className="text-5xl font-semibold text-neutral-900">Patients</h1>
                <Button
                    onClick={() => dispatch(openAddPatientDialog())}
                    className="bg-violet-700 hover:bg-violet-400 text-neutral-50 text-sm font-medium rounded-lg "
                >
                    <UserPlus className="w-4 h-4" />
                    Add new patient
                </Button>
            </div>

            {/* Search and filter */}
            <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-2 rounded-2xl">
                <div className="flex-1 min-w-60">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Search"
                            className="pl-9 bg-white border border-neutral-200 max-w-[240px] w-full"
                            value={searchInput}
                            onChange={(event) => handleSearchChange(event.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <Select
                        value={selectedPhysician}
                        defaultValue={DEFAULT_PHYSICIAN_VALUE}
                        isClearable
                        onValueChange={(value) => {
                            setFilters((prev) => ({
                                ...prev,
                                selectedPhysician: value,
                                page: 1, // Reset to first page when filter changes
                            }));
                        }}
                    >
                        <SelectTrigger className="w-44 bg-white overflow-hidden text-left">
                            <SelectValue placeholder="All Physicians" className="truncate" />
                        </SelectTrigger>
                        <SelectContent>
                            {physicianOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        isClearable={true}
                        defaultValue={DEFAULT_STATUS_VALUE}
                        value={selectedStatus}
                        onValueChange={(value) => {
                            setFilters((prev) => ({
                                ...prev,
                                selectedStatus: value,
                                page: 1, // Reset to first page when filter changes
                            }));
                        }}
                    >
                        <SelectTrigger className="w-40 bg-white overflow-hidden text-left">
                            <SelectValue placeholder="All Statuses" className="truncate" />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <PatientTable
                data={patients}
                isLoading={isLoading}
                error={errorMessage}
                onRetry={refetch}
                isRefetching={isRefetching}
                pagination={pagination}
                onPageChange={(nextPage) =>
                    setFilters((prev) => ({
                        ...prev,
                        page: nextPage,
                    }))
                }
                onInvitePatient={() => {
                    dispatch(openInvitePatientDialog());
                }}
            />

            <AddPatientDialog
                open={isAddPatientDialogOpen}
                onOpenChange={(open: boolean) => {
                    if (!open) {
                        dispatch(closeAddPatientDialog());
                    }
                }}
            />
            <InvitePatientDialog />
        </div>
    );
}

