import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetPatientGenetics } from "@/hooks/useDoctor";
import { AlertCircle } from "lucide-react";
import { createDnaResultsColumns } from "./DnaResultsColumns";
import { useMemo } from "react";

interface DnaResultsTableProps {
    patientId?: string;
}

const DnaResultsSkeleton = () => (
    <div className="space-y-3">
        {[0, 1, 2].map((item) => (
            <div
                key={`dna-skeleton-${item}`}
                className="flex flex-col gap-4 rounded-2xl border border-muted-foreground/20 bg-muted/10 p-4 md:flex-row md:items-center md:justify-between"
            >
                <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-full md:w-64" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-28" />
                </div>
            </div>
        ))}
    </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-destructive/20 bg-destructive/5 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div>
            <p className="typo-body-2 font-semibold text-destructive">Unable to load DNA results</p>
            <p className="typo-body-3 text-muted-foreground">{message}</p>
        </div>
        <Button variant="secondary" onClick={onRetry}>
            Try again
        </Button>
    </div>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-muted-foreground/30 bg-muted/5 p-6 text-center">
        <p className="typo-body-2 font-semibold text-foreground">No DNA tests yet</p>
        <p className="typo-body-3 text-muted-foreground">Order a test to start tracking the lab pipeline.</p>
    </div>
);

export const DnaResultsTable = ({ patientId }: Readonly<DnaResultsTableProps>) => {
    const {
        data: geneticsResponse,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useGetPatientGenetics(patientId ?? "", {
        enabled: Boolean(patientId),
    });

    const results = geneticsResponse?.data ?? [];
    const showSkeleton = isLoading || isFetching;
    const columns = useMemo(() => createDnaResultsColumns(), []);

    return (
        <div className="rounded-3xl border border-muted-foreground/40 bg-primary-foreground p-4">
            {showSkeleton && <DnaResultsSkeleton />}
            {!showSkeleton && isError && (
                <ErrorState message={error?.message ?? "Please try again shortly."} onRetry={() => refetch()} />
            )}
            {!showSkeleton && !isError && results.length === 0 && <EmptyState />}
            {!showSkeleton && !isError && results.length > 0 && (
                <DataTable
                    data={results}
                    columns={columns}
                    className="bg-transparent"
                    headerClassName="bg-transparent"
                />
            )}
        </div>
    );
};