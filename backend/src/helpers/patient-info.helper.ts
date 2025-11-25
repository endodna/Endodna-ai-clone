import { prisma } from "../lib/prisma";
import { logger } from "./logger.helper";

export interface MarkOutdatedParams {
    patientId: string;
    organizationId: number;
    traceId?: string;
}

export async function markPatientInfoOutdated(params: MarkOutdatedParams): Promise<void> {
    const { patientId, organizationId, traceId } = params;

    try {
        await prisma.patientInfo.upsert({
            where: {
                patientId,
            },
            create: {
                patientId,
                organizationId,
                isOutdated: true,
            },
            update: {
                isOutdated: true,
            },
        });

        logger.info("PatientInfo marked as outdated", {
            traceId,
            patientId,
            organizationId,
            method: "markPatientInfoOutdated",
        });
    } catch (error) {
        logger.error("Failed to mark PatientInfo as outdated", {
            traceId,
            patientId,
            organizationId,
            error,
            method: "markPatientInfoOutdated",
        });
    }
}

