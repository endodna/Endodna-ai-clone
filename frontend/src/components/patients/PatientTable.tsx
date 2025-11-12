import { DataTable } from "@/components/ui/data-table";
import { patientColumns } from "./columns";
import { PatientRow } from "@/types/patient";
import { mockPatients } from "./mockData";

interface PatientTableProps {
  /**
   * Array of patient data to display in the table.
   */
  data?: PatientRow[];
  isLoading?: boolean;
  error?: string | null;
}

/**
 * PatientTable component that displays patient data in a data table format.
 */
export function PatientTable({
  data,
  isLoading = false,
  error = null
}: PatientTableProps) {
  // Use provided data or fall back to mock data for development
  const tableData = data ?? mockPatients;

  // Handle loading state (for future API integration)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-500">Loading patients...</p>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <DataTable
      columns={patientColumns}
      data={tableData}
      enableSorting={true}
      enableFiltering={true}
    />
  );
}


