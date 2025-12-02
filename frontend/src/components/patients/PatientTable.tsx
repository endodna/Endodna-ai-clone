import { Button } from "@/components/ui/button";
import { DataTable, PaginationInfo } from "@/components/ui/data-table";
import { Loader2, RefreshCw, UserPlus } from "lucide-react";
import { getPatientColumns } from "./columns";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Loading } from "../Loading";

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
  /**
   * Pagination information
   */
  pagination?: PaginationInfo | null;
  /**
   * Callback when page changes
   */
  onPageChange?: (page: number) => void;
  onInvitePatient?: (patient: PatientRow) => void;
  onEditPatient?: (patient: PatientRow) => void;
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
  pagination,
  onPageChange,
  onInvitePatient,
  onEditPatient,
}: Readonly<PatientTableProps>) {
  const navigate = useNavigate();
  const columns = useMemo(
    () => getPatientColumns(onInvitePatient, onEditPatient),
    [onInvitePatient, onEditPatient],
  );

  const handleRowClick = (patient: PatientRow) => {
    navigate(`/dashboard/patients/${patient.id}`);
  };
  // Handle loading state
  if (isLoading) {
    return (
      <Loading loadingMessage="Loading patients..." />
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center border-2 border-muted-foreground rounded-lg w-full h-full gap-2 text-center">
        <h3 className="text-foreground leading-tight">Patient list failed to load</h3>
        <p className="text-foreground typo-body-1">We encountered an issue while retrieving patient records. Please refresh the page</p>
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
      <div className="flex flex-col justify-center border-2 border-muted-foreground rounded-lg w-full h-full gap-2 text-center">
        <h3 className="text-foreground leading-tight">No patients added yet</h3>
        <p className="text-foreground typo-body-1  ">Start adding a new patient to begin tracking records and activity.</p>
        <Button variant="ghost">
          <UserPlus className="h-4 w-4 mr-2" />
          <span className="typo-body-2 text-foreground">Add new patient</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {isRefetching && (
          <div className="absolute top-2 right-2 z-10 flex items-center space-x-2 rounded-lg border border-muted-foreground bg-primary-foreground px-3 py-1.5 typo-body-3 text-foreground shadow-sm">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span>Refreshing</span>
        </div>
      )}
      <DataTable
        columns={columns}
        data={data}
        enableSorting={true}
        enableFiltering={true}
        onRowClick={handleRowClick}
        pagination={pagination}
        onPageChange={onPageChange}
      />
    </div>
  );
}


