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
import { useEffect, useState } from "react";
import { PatientTable } from "../../components/patients/PatientTable";

export default function PatientListPage() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");

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

    const patients: PatientRow[] = apiResponse?.data?.items ?? [];
    const pagination = apiResponse?.data?.pagination;

    const errorMessage = error
        ? (error as any)?.message ?? apiResponse?.message ?? "Failed to fetch patients"
        : apiResponse?.error
            ? apiResponse.message
            : null;

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

            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-60">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Search"
                            className="pl-9 bg-white border border-neutral-200 max-w-[240px] w-full"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <Select>
                        <SelectTrigger className="w-44 bg-white">
                            <SelectValue placeholder="All Physicians" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Physicians</SelectItem>
                            <SelectItem value="1">Dr. Kaufmann</SelectItem>
                            <SelectItem value="2">Dr. David Lee</SelectItem>
                            <SelectItem value="3">Dr. Michael Thompson</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select>
                        <SelectTrigger className="w-40 bg-white">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="invite">Invite Pending</SelectItem>
                            <SelectItem value="labs">Labs Pending</SelectItem>
                            <SelectItem value="dna">DNA Ready</SelectItem>
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

