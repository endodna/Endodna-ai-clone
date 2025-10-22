import { randomUUID } from "crypto";
import { UserType } from "../types";

export const generateTraceId = (): string => {
    return randomUUID();
};

export const buildRedisSession = ({ userType, userId, sessionId, data }: {
    userType: UserType;
    userId: string;
    sessionId: string;
    data?: Record<string, any>;
}) => {
    return JSON.stringify({
        userType,
        userId,
        sessionId,
        data
    })
}