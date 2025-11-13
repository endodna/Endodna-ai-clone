import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PatientRow } from "@/types/patient";
import { Loader2, RefreshCw, UserPlus } from "lucide-react";
import { patientColumns } from "./columns";

interface PatientTableProps {
  /**
   * Array of patient data to display in the table.
   */
  data?: PatientRow[];
  /**
   * Loading state indicator
   */
  isLoading?: boolean;
  /**
   * Error message to display
   */
  error?: string | null;
  /**
   * Callback to retry fetching data
   */
  onRetry?: () => void;
  /**
   * Whether data is being refetched in the background
   */
  isRefetching?: boolean;
}

/**
 * PatientTable component that displays patient data in a data table format.
 */
export function PatientTable({
  data = [],
  isLoading = false,
  error = null,
  onRetry,
  isRefetching = false,
}: PatientTableProps) {
  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
        <p className="text-neutral-500 text-sm">Loading patients...</p>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center border-2 border-neutral-300 rounded-lg w-full h-full gap-2 text-center">
        <p className="text-neutral-700 text-2xl font-semibold leading-tight">Patient list failed to load</p>
        <p className="text-neutral-700 text-base font-semibold leading-normal">We encountered an issue while retrieving patient records. Please refresh the page</p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="ghost"
            className="w-fit"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>
    );
  }

  // Handle empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col justify-center border-2 border-neutral-300 rounded-lg w-full h-full gap-2 text-center">
        <p className="text-neutral-700 text-2xl font-semibold leading-tight">No patients added yet</p>
        <p className="text-neutral-700 text-base font-semibold leading-normal">Start adding a new patient to begin tracking records and activity.</p>
        <Button variant="ghost">
          <UserPlus className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium leading-normal text-neutral-700">Add new patient</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {isRefetching && (
        <div className="absolute top-2 right-2 z-10 flex items-center space-x-2 rounded-lg border border-neutral-200 bg-white/90 px-3 py-1.5 text-xs text-neutral-500 shadow-sm">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-700" />
          <span>Refreshing</span>
        </div>
      )}
      <DataTable
        columns={patientColumns}
        data={data}
        enableSorting={true}
        enableFiltering={true}
      />
    </div>
  );
}


