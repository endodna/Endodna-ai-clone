import { randomUUID } from "crypto";
import { UserType } from "../types";

export const generateTraceId = (): string => {
  return randomUUID();
};

export const generateOrderId = (): string => {
  const timestamp = Date.now();
  return `BIOSAI-${timestamp}`;
};

export const buildRedisSession = ({
  userType,
  userId,
  sessionId,
  data,
  organizationId,
  parentOrganizationId,
  isPasswordSet,
  transferCompleted,
  isLicenseeOrganization,
}: {
  userType: UserType;
  userId: string;
  sessionId: string;
  organizationId?: number;
  parentOrganizationId?: number | null;
  isPasswordSet?: boolean;
  data?: Record<string, any>;
  transferCompleted?: boolean;
  isLicenseeOrganization?: boolean;
}) => {
  return JSON.stringify({
    userType,
    userId,
    sessionId,
    data,
    organizationId,
    parentOrganizationId,
    isPasswordSet,
    transferCompleted: transferCompleted ?? false,
    isLicenseeOrganization: isLicenseeOrganization ?? false,
  });
};
