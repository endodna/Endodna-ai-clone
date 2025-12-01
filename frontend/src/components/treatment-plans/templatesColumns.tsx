import type { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical, FileText, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TreatmentPlanTemplateRow {
  id: string;
  name: string;
  lastUpdated: string;
  createdBy: string;
  // Store full form data so edit form can be pre-populated
  patientIdentificationDemographics: string;
  medicalHistory: string;
  currentConditionDiagnosis: string;
  assessmentData: string;
  treatmentGoalsExpectedOutcomes: string;
  interventionsStrategies: string;
  rolesResponsibilities?: string;
  timeline?: string;
  progressNotesEvaluation?: string;
  dischargePreventionPlan?: string;
}

export const getTreatmentPlanTemplateColumns = (
  onEdit?: (template: TreatmentPlanTemplateRow) => void,
  onDelete?: (template: TreatmentPlanTemplateRow) => void,
): ColumnDef<TreatmentPlanTemplateRow>[] => [
  {
    id: "name",
    accessorKey: "name",
    header: () => <span className="text-foreground">Templates</span>,
    cell: ({ row }) => {
      const template = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground">
            <FileText className="h-4 w-4 text-neutral-500-old" />
          </div>
          <div className="flex flex-col">
            <span className="text-foreground typo-body-2 font-medium">
              {template.name}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    id: "lastUpdated",
    accessorKey: "lastUpdated",
    header: () => <span className="text-foreground">Last updated</span>,
    cell: ({ row }) => {
      const template = row.original;
      return (
        <span className="text-foreground typo-body-2">
          {template.lastUpdated}
        </span>
      );
    },
  },
  {
    id: "createdBy",
    accessorKey: "createdBy",
    header: () => <span className="text-foreground">Created by</span>,
    cell: ({ row }) => {
      const template = row.original;
      return (
        <span className="text-foreground typo-body-2">
          {template.createdBy}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const template = row.original;
      return (
        <div className="flex items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-neutral-200 bg-primary-foreground hover:bg-neutral-200"
              >
              <EllipsisVertical className="h-5 w-5 text-neutral-500-old" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-primary-foreground border border-muted-foreground">
              <DropdownMenuItem
                className="cursor-pointer typo-body-3 text-foreground"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit?.(template);
                }}
              ><Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer typo-body-3 text-destructive"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete?.(template);
                }}
              ><Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];


