import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  EllipsisVertical,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { formatDate } from "@/utils/date.utils";
import { getDNAStatusDisplay } from "@/utils/patient.utils";
import { AlertIcon } from "./AlertIcon";


export const patientColumns: ColumnDef<PatientRow>[] = [
  {
    id: "alert",
    header: "",
    cell: ({ row }) => {
      const patientStatus = row.original.status;
      return (
        <AlertIcon status={patientStatus} />
      );
    },
  },
  {
    id: "patient",
    accessorKey: "patient",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium text-neutral-950 text-sm leading-normal hover:bg-transparent"
        >
          Patient
          <ArrowUpDown className="ml-2 h-4 w-4 text-neutral-600 opacity-50" />
        </Button>
      );
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const nameA = `${rowA.original.firstName ?? ""} ${rowA.original.lastName ?? ""}`.trim().toLowerCase();
      const nameB = `${rowB.original.firstName ?? ""} ${rowB.original.lastName ?? ""}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    },
    cell: ({ row }) => {
      const patient = row.original;
      const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim();

      const dob = formatDate(patient.dateOfBirth);

      return (
        <div className="flex items-start gap-3">

          <div className="flex flex-col">
            <span className="text-neutral-950 text-sm font-normal leading-normal capitalize">
              {fullName ?? ''}
            </span>
            <div className="space-x-2 text-xs text-muted-foreground font-semibold leading-normal">
              <span className="text-xs text-neutral-500">{patient.id && `ID: ${patient.id}`}</span>
              <span className="text-xs text-neutral-500">{dob && `DOB: ${dob}`}</span>
            </div>
          </div>
        </div>
      );
    },
    meta: {
      headerClassName: "",
    },
  },
  {
    id: "status",
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium text-neutral-950 text-sm leading-normal hover:bg-transparent"
        >
          DNA Test Status
          <ArrowUpDown className="ml-2 h-4 w-4 text-neutral-600 opacity-50" />
        </Button>
      );
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      // Get the most recent DNA result for each patient
      const getLatestDNAStatus = (patient: PatientRow): string => {
        const latestDNAResult = patient.patientDNAResults
          ?.filter(result => result.status)
          .sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
          })[0];
        return latestDNAResult?.status || "";
      };

      const statusA = getLatestDNAStatus(rowA.original);
      const statusB = getLatestDNAStatus(rowB.original);
      
      // Sort alphabetically by status string
      return statusA.localeCompare(statusB);
    },
    cell: ({ row }) => {
      const patient = row.original;
      // Get the most recent DNA result based on updatedAt
      const latestDNAResult = patient.patientDNAResults
        ?.filter(result => result.status) // Only results with a status
        .sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA; // Most recent first
        })[0];

      if (!latestDNAResult) {
        return <span className="text-neutral-400">-</span>;
      }

      const { text } = getDNAStatusDisplay(latestDNAResult.status);

      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-2 py-[3px] text-xs font-medium leading-normal bg-neutral-100 capitalize">{text}</Badge>
        </div>
      );
    },
    meta: {
      headerClassName: "",
    },
  },
  {
    id: "patientActivities",
    accessorKey: "patientActivities",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium text-neutral-950 text-sm leading-normal hover:bg-transparent"
        >
          Last activity
          <ArrowUpDown className="ml-2 h-4 w-4 text-neutral-600 opacity-50" />
        </Button>
      );
    },
    enableSorting: true,
    cell: ({ row }) => {
      const patient = row.original;
      // Get the most recent activity based on dateCompleted (preferred) or createdAt (fallback)
      const latestActivity = patient.patientActivities
        ?.filter(activity => activity.activity) // Only activities with an activity field
        .sort((a, b) => {
          // Prefer dateCompleted, fallback to createdAt
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Most recent first
        })[0];

      if (!latestActivity) {
        return <span className="text-neutral-400">-</span>;
      }

      // Get the date from dateCompleted or createdAt
      const activityDate = latestActivity.createdAt;
      const formattedDate = formatDate(activityDate);

      return (
        <div className="flex flex-col items-start">
          <span className="text-neutral-950 font-normal text-sm leading-normal">
            Lab Results
          </span>
          <span className="text-muted-foreground text-xs font-normal leading-normal">
            {formattedDate}
          </span>
        </div>
      );
    },
    meta: {
      headerClassName: "",
    },
  },
  {
    id: "healthGoal",
    accessorKey: "healthGoal",
    header: "Health Goals",
    cell: ({ row }) => {
      const goal = row.original.patientGoals?.[0]?.description || "-";
      // Truncate text after certain length and add ellipsis
      const maxLength = 50;
      const truncated = goal.length > maxLength
        ? `${goal.substring(0, maxLength)}...`
        : goal;
      return (
        <div className="line-clamp-1 text-neutral-700">
          {truncated}
        </div>
      );
    },
    meta: {
      headerClassName: "",
    },
  },
  {
    id: "physician",
    accessorKey: "physician",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium text-neutral-950 text-sm leading-normal hover:bg-transparent"
        >
          Physician
          <ArrowUpDown className="ml-2 h-4 w-4 text-neutral-600 opacity-50" />
        </Button>
      );
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const doctorA = rowA.original.managingDoctor;
      const doctorB = rowB.original.managingDoctor;
      const nameA = doctorA ? `${doctorA.firstName} ${doctorA.lastName}`.trim().toLowerCase() : "";
      const nameB = doctorB ? `${doctorB.firstName} ${doctorB.lastName}`.trim().toLowerCase() : "";
      return nameA.localeCompare(nameB);
    },
    cell: ({ row }) => {
      const doctor = row.original.managingDoctor;
      const physicianName = doctor
        ? `Dr. ${doctor.firstName} ${doctor.lastName}`.trim()
        : "";
      return (
        <span className="text-neutral-700">
          {physicianName ?? <span className="text-neutral-400">No physician assigned</span>}
        </span>
      );
    },
    meta: {
      headerClassName: "",
    },
  },
  {
    id: "actions",
    header: "",
    cell: () => (
      <div className="text-right last:rounded-r-xl" onClick={(e) => e.stopPropagation()}>
        <button className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-neutral-200 hover:bg-neutral-200">
          <EllipsisVertical className="h-5 w-5 text-neutral-500" />
        </button>
      </div>
    ),
    meta: {
      headerClassName: "",
    },
  },
];

