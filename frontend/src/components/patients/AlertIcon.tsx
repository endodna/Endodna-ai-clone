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
import { PatientStatus } from "@/types/patient";

interface AlertIconProps {
  status: string;
}

/**
 * Alert icon component that displays different icons based on patient status
 * @param status - Patient status string
 * @returns React component with appropriate status icon
 */
export function AlertIcon({ status }: AlertIconProps) {
  switch (status) {
    case PatientStatus.ACTIVE:
      return <CircleDot className="h-5 w-5 text-lime-600" />;
    case PatientStatus.INACTIVE:
      return <CircleX className="h-5 w-5 text-red-600" />;
    case PatientStatus.PENDING:
      return <Ban className="h-5 w-5 text-amber-600" />;
    case PatientStatus.DEACTIVATED:
      return <CircleX className="h-5 w-5 text-red-600" />;
    case PatientStatus.BLOCKED:
      return <Lock className="h-5 w-5 text-red-600" />;
    case PatientStatus.DELETED:
      return <Trash className="h-5 w-5 text-red-600" />;
    case PatientStatus.ACHIEVED:
      return <CircleCheck className="h-5 w-5 text-lime-600" />;
    case PatientStatus.IN_PROGRESS:
      return <CircleDashed className="h-5 w-5 text-blue-600" />;
    case PatientStatus.CANCELLED:
      return <CircleX className="h-5 w-5 text-red-600" />;
    case PatientStatus.RESOLVED:
      return <CircleCheck className="h-5 w-5 text-lime-600" />;
    case PatientStatus.IN_RANGE:
      return <CircleCheck className="h-5 w-5 text-lime-600" />;
    case PatientStatus.OUT_OF_RANGE:
      return <CircleX className="h-5 w-5 text-red-600" />;
    case PatientStatus.LOW:
      return <CircleCheck className="h-5 w-5 text-lime-600" />;
    case PatientStatus.HIGH:
      return <CircleX className="h-5 w-5 text-red-600" />;
    case PatientStatus.ANOMALOUS:
      return <CircleX className="h-5 w-5 text-red-600" />;
    case PatientStatus.READY:
      return <CircleCheck className="h-5 w-5 text-lime-600" />;
    default:
      return <Circle className="h-5 w-5 text-red-600" />;
  }
}

