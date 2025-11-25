/**
 * Alert icon component that displays different icons based on patient status
 */

import {
  Ban,
  Circle,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleX,
  Lock,
  Trash,
} from "lucide-react";
import { PatientStatus } from "@/components/constants/patient";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { formatStatusText } from "@/utils/patient.utils";

interface AlertIconProps {
  status?: string;
}

/**
 * Alert icon component that displays different icons based on patient status
 * @param status - Patient status string
 * @returns React component with appropriate status icon
 */
export function AlertIcon({ status }: AlertIconProps) {
  const statusText = status ? formatStatusText(status) : "Invalid";
  let icon: React.ReactNode = null;
  switch (status) {
    case PatientStatus.ACTIVE:
      icon = <CircleDot className="h-5 w-5 text-lime-600" />;
      break;
    case PatientStatus.INACTIVE:
      icon = <CircleX className="h-5 w-5 text-red-600" />;
      break;
    case PatientStatus.PENDING:
      icon = <Ban className="h-5 w-5 text-amber-600" />;
      break;
    case PatientStatus.DEACTIVATED:
      icon = <CircleX className="h-5 w-5 text-red-600" />;
      break;
    case PatientStatus.BLOCKED:
      icon = <Lock className="h-5 w-5 text-red-600" />;
      break;
    case PatientStatus.DELETED:
      icon = <Trash className="h-5 w-5 text-red-600" />;
      break;
    case PatientStatus.ACHIEVED:
      icon = <CircleCheck className="h-5 w-5 text-lime-600" />;
      break;
    case PatientStatus.IN_PROGRESS:
      icon = <CircleDashed className="h-5 w-5 text-blue-600" />;
      break;
    case PatientStatus.CANCELLED:
      icon = <CircleX className="h-5 w-5 text-red-600" />;
      break;
    case PatientStatus.RESOLVED:
      icon = <CircleCheck className="h-5 w-5 text-lime-600" />;
      break;
    case PatientStatus.IN_RANGE:
      icon = <CircleCheck className="h-5 w-5 text-lime-600" />;
      break;
    case PatientStatus.OUT_OF_RANGE:
      icon = <CircleX className="h-5 w-5 text-red-600" />;
      break;
    case PatientStatus.LOW:
      icon = <CircleCheck className="h-5 w-5 text-lime-600" />;
      break;
    case PatientStatus.HIGH:
      icon = <CircleX className="h-5 w-5 text-red-600" />;
      break;
    case PatientStatus.ANOMALOUS:
      icon = <CircleX className="h-5 w-5 text-red-600" />;
      break;
    case PatientStatus.READY:
      icon = <CircleCheck className="h-5 w-5 text-lime-600" />;
      break;
    default:
      icon = <Circle className="h-5 w-5 text-red-600" />;
      break;
  }

  return (
    <Tooltip>
    <TooltipTrigger asChild>
      <div className="p-2">
        {icon}
      </div>
    </TooltipTrigger>
    <TooltipContent side="top" className="capitalize px-2">
      {statusText}
    </TooltipContent>
  </Tooltip>
  )
}

