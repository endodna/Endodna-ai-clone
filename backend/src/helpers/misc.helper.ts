import { randomUUID } from "crypto";
import { UserType } from "../types";

export const generateTraceId = (): string => {
  return randomUUID();
};

export const buildRedisSession = ({
  userType,
  userId,
  sessionId,
  data,
  organizationId,
  isPasswordSet,
}: {
  userType: UserType;
  userId: string;
  sessionId: string;
  organizationId?: string;
  isPasswordSet?: boolean;
  data?: Record<string, any>;
}) => {
  return JSON.stringify({
    userType,
    userId,
    sessionId,
    data,
    organizationId,
    isPasswordSet,
  });
};
