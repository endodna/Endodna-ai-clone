import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useGetDoctorPatients, useGetDoctors, useGetConstants } from "@/hooks/useDoctor";
import { Search, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PatientTable } from "../../components/patients/PatientTable";
import debounce from "@/utils/utils";

export default function PatientListPage() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [selectedPhysician, setSelectedPhysician] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");

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
        doctorId: selectedPhysician !== "all" ? selectedPhysician : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
    });

    const patients: PatientRow[] = apiResponse?.data?.items ?? [];
    const pagination = apiResponse?.data?.pagination;

    const errorMessage = error
        ? (error as any)?.message ?? apiResponse?.message ?? "Failed to fetch patients"
        : apiResponse?.error
            ? apiResponse.message
            : null;

    // Debounced search handler
    const debouncedSetSearch = useMemo(
        () => debounce((value: string) => {
            setSearch(value);
            setPage(1);
        }, 300),
        []
    );

    // Handle search input change
    const handleSearchChange = (value: string) => {
        setSearchInput(value); // Update input immediately
        debouncedSetSearch(value); // Trigger debounced API call
    };

    // Build physician options from fetched doctors
    const physicianOptions = useMemo(() => {
        const options = [{ value: "all", label: "All Physicians" }];
        if (doctors && doctors.length > 0) {
            doctors.forEach((doctor) => {
                const fullName = `${doctor.firstName} ${doctor.lastName}`.trim();
                options.push({
                    value: doctor.id,
                    label: fullName ?? doctor.email,
                });
            });
        }
        return options;
    }, [doctors]);

    // Build status options from fetched constants
    const statusOptions = useMemo(() => {
        const options = [{ value: "all", label: "All Statuses" }];
        if (constants) {
            // Add DNA result statuses
            if (constants.dnaResultStatus && constants.dnaResultStatus.length > 0) {
                constants.dnaResultStatus.forEach((status) => {
                    options.push({
                        value: status,
                        label: status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                    });
                });
            }
        }
        return options;
    }, [constants]);

    // Handle pagination changes
    useEffect(() => {
        if (!pagination) return;

        if (pagination.totalPages === 0 && page !== 1) {
            setPage(1);
            return;
        }

        if (pagination.totalPages > 0 && page > pagination.totalPages) {
            setPage(pagination.totalPages);
        }
    }, [pagination, page]);

    return (
        <div className="space-y-6 flex flex-col h-full w-full">
            <div className="flex items-center justify-between">
                <h1 className="text-5xl font-semibold text-neutral-900">Patients</h1>
                <Button className="bg-violet-700 hover:bg-violet-400 text-neutral-50 text-sm font-medium rounded-lg ">
                    <UserPlus className="w-4 h-4" />
                    Add new patient
                </Button>
            </div>

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
                        onValueChange={(value) => {
                            setSelectedPhysician(value);
                            setPage(1); // Reset to first page when filter changes
                        }}
                    >
                        <SelectTrigger className="w-44 bg-white">
                            <SelectValue placeholder="All Physicians" />
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
                        value={selectedStatus}
                        onValueChange={(value) => {
                            setSelectedStatus(value);
                            setPage(1); // Reset to first page when filter changes
                        }}
                    >
                        <SelectTrigger className="w-40 bg-white">
                            <SelectValue placeholder="All Statuses" />
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
                onPageChange={setPage}
            />
        </div>
    );
}

