import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusChip } from "./StatusChip";
import { EllipsisVertical, TriangleAlert, Ban } from "lucide-react";

export interface PatientRow {
  id: string;
  name: string;
  subId: string;
  dob: string;
  status: "invite" | "labs" | "dna";
  lastActivity: string;
  healthGoal: string;
  physician: string;
}

function StatusCell({ status }: { status: PatientRow["status"] }) {
  if (status === "labs") {
    return (
      <div className="flex items-center gap-2">
        <StatusChip label="Labs pending" variant="neutral" />
        <div className="bg-red-600 w-6 h-6 rounded-md flex items-center justify-center">
          <TriangleAlert className="h-4 w-4 text-white" />
        </div>
      </div>
    );
  }
  if (status === "dna") {
    return <StatusChip label="DNA ready" variant="success" />;
  }
  return (
    <div className="flex items-center gap-2">
      <StatusChip label="Invite pending" variant="neutral" />
      <Ban className="h-4 w-4 text-orange-500" />
    </div>
  );
}

export function PatientTableRow({ row }: { row: PatientRow }) {
  return (
    <tr className=" border-none">
      <td className="py-4 px-4 first:rounded-l-xl">
        <Ban className="h-4 w-4 text-orange-500" />
      </td>
      <td className="py-4 px-4 first:rounded-l-xl">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{row.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-neutral-900">{row.name}</span>
            <span className="text-xs text-neutral-500">
              ID: {row.subId} • DOB: {row.dob}
            </span>
          </div>
        </div>
      </td>
      <td className="py-4 px-4 ">
        <StatusCell status={row.status} />
      </td>
      <td className="py-4 px-4 text-neutral-700 ">{row.lastActivity}</td>
      <td className="py-4 px-4 text-neutral-700 ">
        <div className="line-clamp-1">{row.healthGoal}</div>
      </td>
      <td className="py-4 px-4 text-neutral-700">{row.physician}</td>
      <td className="py-4 px-4 text-right last:rounded-r-xl">
        <button className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-neutral-100">
          <EllipsisVertical className="h-5 w-5 text-neutral-500" />
        </button>
      </td>
    </tr>
  );
}


