import { PatientStatus } from "@/components/constants/patient";
import { Button } from "@/components/ui/button";
import { calculateAge, formatDate } from "@/utils/date.utils";
import { formatStatusText } from "@/utils/patient.utils";
import { truncateText } from "@/utils/utils";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  EllipsisVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { AlertIcon } from "./AlertIcon";

type InviteHandler = (patient: PatientRow) => void;
type EditHandler = (patient: PatientRow) => void;

export const getPatientColumns = (
  onInvite?: InviteHandler,
  onEdit?: EditHandler,
): ColumnDef<PatientRow>[] => [
    {
      id: "alert",
      header: "",
      cell: ({ row }) => {
        const patientStatus = row.original.status;
        const isPending = patientStatus === PatientStatus.PENDING;

        if (isPending && onInvite) {
          return (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onInvite(row.original);
              }}
              className=""
            >
              <AlertIcon status={patientStatus} />
            </button>
          );
        }

        return <AlertIcon status={patientStatus} />;
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
            className="p-0"
          >
            <span className="text-foreground">Patient</span>
            <ArrowUpDown className="ml-2 h-4 w-4 text-foreground opacity-50" />
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

        const dob = patient.dateOfBirth ? formatDate(patient.dateOfBirth, "MM/DD/YYYY") : null;
        const age = calculateAge(patient.dateOfBirth);
        const gender = patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).toLowerCase() : null;

        // Build the info array with available data
        const infoParts: string[] = [];
        if (dob) {
          infoParts.push(`DOB: ${dob}`);
        }
        if (age !== null) {
          infoParts.push(`${age} ${age === 1 ? 'year' : 'years'}`);
        }
        if (gender) {
          infoParts.push(gender);
        }

        return (
          <div className="flex items-start gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-foreground typo-body-2 capitalize">
                {fullName ?? ''}
              </span>
              {infoParts.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap typo-body-3 text-foreground">
                  {infoParts.map((part, index) => (
                    <span key={`${part}-${index}`} className="inline-flex items-center">
                      {part}
                      {index < infoParts.length - 1 && (
                        <span className="mx-1.5 text-foreground">•</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
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
            className="p-0"
          >
            <span className="text-foreground">DNA Test Status</span>
            <ArrowUpDown className="ml-2 h-4 w-4 text-foreground opacity-50" />
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
          return <span className="text-foreground">-</span>;
        }

        const statusText = formatStatusText(latestDNAResult.status);

        return (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-2 py-[3px] typo-body-3 text-foreground capitalize">{statusText}</Badge>
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
            className="p-0"
          >
            <span className="text-foreground">Last activity</span>
            <ArrowUpDown className="ml-2 h-4 w-4 text-foreground opacity-50" />
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
          return <span className="text-foreground">-</span>;
        }

        // Get the date from dateCompleted or createdAt
        const activityDate = latestActivity.createdAt;
        const formattedDate = formatDate(activityDate);

        return (
          <div className="flex flex-col items-start">
            <span className="text-foreground  typo-body-2 ">
              Lab Results
            </span>
            <span className="text-foreground typo-body-3  ">
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
      header: () => {
        return <span className="text-foreground">Health Goals</span>;
      },
      cell: ({ row }) => {
        const goal = row.original.patientGoals?.[0]?.description || "-";
        const truncated = truncateText(goal, 50);
        return <div className="line-clamp-1 text-foreground">{truncated}</div>;
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
            className="p-0"
          >
            <span className="text-foreground">Physician</span>
            <ArrowUpDown className="ml-2 h-4 w-4 text-foreground opacity-50" />
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
          <span className="text-foreground">
            {physicianName ?? <span className="text-foreground">No physician assigned</span>}
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
      cell: ({ row }) => (
        <div className="flex items-center justify-end last:rounded-r-xl">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-muted-foreground bg-primary-foreground hover:bg-muted-foreground/30"
                onClick={(event) => event.stopPropagation()}
              >
                <EllipsisVertical className="h-5 w-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-primary-foreground border border-muted-foreground"
              onClick={(event) => event.stopPropagation()}
            >
              <DropdownMenuItem
                className="cursor-pointer typo-body-3 text-foreground"
                onClick={(event) => {
                  event.stopPropagation();
                  if (onEdit) {
                    onEdit(row.original);
                  }
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer typo-body-3 text-destructive"
                onClick={(event) => event.stopPropagation()}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      meta: {
        headerClassName: "",
      },
    },
  ];

