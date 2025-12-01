import { useMemo } from "react";
import { DataTable, type PaginationInfo } from "@/components/ui/data-table";
import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  getTreatmentPlanTemplateColumns,
  type TreatmentPlanTemplateRow,
} from "./templatesColumns";

interface TreatmentPlanTemplatesTableProps {
  data?: TreatmentPlanTemplateRow[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isRefetching?: boolean;
  pagination?: PaginationInfo | null;
  onPageChange?: (page: number) => void;
  onEditTemplate?: (template: TreatmentPlanTemplateRow) => void;
  onDeleteTemplate?: (template: TreatmentPlanTemplateRow) => void;
}

export function TreatmentPlanTemplatesTable({
  data = [],
  isLoading = false,
  error = null,
  onRetry,
  isRefetching = false,
  pagination,
  onPageChange,
  onEditTemplate,
  onDeleteTemplate,
}: Readonly<TreatmentPlanTemplatesTableProps>) {
  const columns = useMemo(
    () => getTreatmentPlanTemplateColumns(onEditTemplate, onDeleteTemplate),
    [onEditTemplate, onDeleteTemplate],
  );

  if (isLoading) {
    return <Loading loadingMessage="Loading treatment plan templates..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center border-2 border-muted-foreground rounded-lg w-full h-full gap-2 text-center">
        <h3 className="text-foreground leading-tight">
          Template list failed to load
        </h3>
        <p className="text-foreground typo-body-1">
          We encountered an issue while retrieving templates. Please refresh the
          page.
        </p>
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

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col justify-center border-2 border-muted-foreground rounded-lg w-full h-full gap-2 text-center">
        <h3 className="text-foreground leading-tight">
          No templates created yet
        </h3>
        <p className="text-foreground typo-body-1">
          Start by creating a treatment plan template to build your library.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {isRefetching && (
        <div className="absolute top-2 right-2 z-10 flex items-center space-x-2 rounded-lg border border-muted-foreground bg-primary-foreground px-3 py-1.5 typo-body-3 text-foreground shadow-sm">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
          <span>Refreshing</span>
        </div>
      )}
      <DataTable
        columns={columns}
        data={data}
        enableSorting
        enableFiltering={false}
        pagination={pagination}
        onPageChange={onPageChange}
      />
    </div>
  );
}


