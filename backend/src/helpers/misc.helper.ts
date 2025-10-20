import { randomUUID } from "crypto";

export const generateTraceId = (): string => {
    return randomUUID();
};