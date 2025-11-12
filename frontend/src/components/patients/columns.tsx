import { PATIENT_STATUS, PatientRow } from "@/types/patient";
import { ColumnDef } from "@tanstack/react-table";
import {
  Ban,
  CircleDashed,
  CircleDot,
  EllipsisVertical
} from "lucide-react";

function AlertIcon({ patient }: { patient: PatientRow }) {
  const status = patient.status;

  switch (status) {
    case PATIENT_STATUS.PENDING:
      return <Ban className="h-5 w-5 text-amber-600" />;
    case PATIENT_STATUS.INVITED:
      return <CircleDashed className="h-5 w-5 text-blue-600" />;
    case PATIENT_STATUS.ACTIVE:
      return <CircleDot className="h-5 w-5 text-lime-600" />;
    default:
      return <></>;
  }
}

/**
 * Formats date to MM/DD/YYYY
 */
function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "";
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${month}/${day}/${year}`;
  } catch {
    return "";
  }
}

export const patientColumns: ColumnDef<PatientRow>[] = [
  {
    id: "alert",
    header: "",
    cell: ({ row }) => {
      return (
      <div className="flex items-center justify-center p-2">
          <AlertIcon patient={row.original} />
      </div>
    );
  },
  },
  {
    id: "patient",
    accessorKey: "Patient ",
    header: "Patient",
    cell: ({ row }) => {
      const patient = row.original;
      const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim();

      const dob = formatDate(patient.dateOfBirth);

      return (
        <div className="flex items-start gap-3">

          <div className="flex flex-col">
            <span className="text-neutral-950 text-sm font-normal leading-normal">
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
    header: "DNA Test Status",
    cell: () => <></>,
    meta: {
      headerClassName: "",
    },
  },
  {
    id: "lastActivity",
    accessorKey: "lastActivity",
    header: "Last activity",
    cell: () => {
      return (
        <span className="text-neutral-700">
        </span>
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
    accessorKey: "Physician",
    header: "Physician",
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
      <div className="text-right last:rounded-r-xl">
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

