import { PatientPagination } from "@/components/patients/PatientPagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useDoctorPatients } from "@/hooks/useDoctor";
import { PatientRow } from "@/types/patient";
import { Search, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PatientTable } from "../../components/patients/PatientTable";
import debounce from "@/utils/utils";
import { PHYSICIAN_OPTIONS, STATUS_OPTIONS } from "@/components/patients/constants";

export default function PatientListPage() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [selectedPhysician, setSelectedPhysician] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");

    const {
        data: apiResponse,
        isLoading,
        error,
        isRefetching,
        refetch,
    } = useDoctorPatients({
        page,
        limit,
        search: search || undefined,
    });

    const allPatients: PatientRow[] = apiResponse?.data?.items ?? [];
    const pagination = apiResponse?.data?.pagination;

    // Client-side filtering (Till backend is updated)
    const filteredPatients = useMemo(() => {
        let filtered = [...allPatients];

        // Filter by physician
        if (selectedPhysician !== "all") {
            filtered = filtered.filter((patient) => {
                return patient.managingDoctor?.id === selectedPhysician;
            });
        }

        // Filter by status
        if (selectedStatus !== "all") {
            filtered = filtered.filter((patient) => {
                // Map UI status values to actual patient data
                switch (selectedStatus) {
                    case "invite":
                        // Invite Pending - patients with PENDING status
                        return patient.status === "PENDING";
                    case "labs":
                        // Labs Pending - patients with DNA results in pending/processing states
                        const hasPendingLabs = patient.patientDNAResults?.some(
                            (result) =>
                                result.status === "KIT_RECEIVED" ||
                                result.status === "PROCESS" ||
                                result.status === "QC_PASSED" ||
                                result.status === "DNA_EXTRACTION_ACCEPTED"
                        );
                        return hasPendingLabs || patient.patientDNAResults?.length === 0;
                    case "dna":
                        // DNA Ready - patients with completed DNA results
                        const hasCompletedDNA = patient.patientDNAResults?.some(
                            (result) =>
                                result.status === "GENOTYPING_ACCEPTED" ||
                                result.status === "GENOTYPING_2ND_ACCEPTED"
                        );
                        return hasCompletedDNA;
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }, [allPatients, selectedPhysician, selectedStatus]);

    const patients = filteredPatients;

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
        }, 500),
        []
    );

    // Handle search input change
    const handleSearchChange = (value: string) => {
        setSearchInput(value); // Update input immediately
        debouncedSetSearch(value); // Trigger debounced API call
    };

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
                            {PHYSICIAN_OPTIONS.map((option) => (
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
                            {STATUS_OPTIONS.map((option) => (
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
            />

            <PatientPagination
                pagination={pagination}
                onPageChange={setPage}
            />
        </div>
    );
}

