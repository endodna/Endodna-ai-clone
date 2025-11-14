import * as cron from "node-cron";
import { logger } from "../../helpers/logger.helper";
import { generateTraceId } from "../../helpers/misc.helper";
import medicalRecordProcessorService from "./medicalRecordProcessor.service";
import pendingDNAFileProcessorService from "./pendingDNAFileProcessor.service";

class CronService {
    private jobs: Map<string, cron.ScheduledTask> = new Map();

    async initialize(): Promise<void> {
        logger.info("Initializing cron jobs", {
            method: "CronService.initialize",
        });

        // For future, create cron job to invalidate sessions that are over 8 hours
        // Go over features and see if there are any other cron jobs that need to be created for data cleanup or remediation etc.
        this.scheduleMedicalRecordsProcessing();
        this.schedulePendingDNAFilesProcessing();

        logger.info("Cron jobs initialized", {
            method: "CronService.initialize",
            jobCount: this.jobs.size,
        });
    }

    stopAll(): void {
        logger.info("Stopping all cron jobs", {
            method: "CronService.stopAll",
            jobCount: this.jobs.size,
        });

        this.jobs.forEach((job, name) => {
            job.stop();
            logger.info(`Stopped cron job: ${name}`, {
                method: "CronService.stopAll",
                jobName: name,
            });
        });

        this.jobs.clear();
    }

    stop(jobName: string): void {
        const job = this.jobs.get(jobName);
        if (job) {
            job.stop();
            this.jobs.delete(jobName);
            logger.info(`Stopped cron job: ${jobName}`, {
                method: "CronService.stop",
                jobName,
            });
        }
    }

    private scheduleMedicalRecordsProcessing(): void {
        const schedule = process.env.MEDICAL_RECORDS_PROCESSING_CRON || "*/3 * * * *";
        const runImmediately = process.env.RUN_MEDICAL_RECORDS_PROCESSING_ON_START === "true";

        if (runImmediately) {
            const traceId = generateTraceId();
            logger.info("Running medical records processing immediately on startup", {
                traceId,
                method: "CronService.scheduleMedicalRecordsProcessing",
            });

            this.triggerMedicalRecordsProcessing(traceId).catch((error) => {
                logger.error("Medical records processing failed on startup", {
                    traceId,
                    error: error,
                    method: "CronService.scheduleMedicalRecordsProcessing",
                });
            });
        }

        const job = cron.schedule(schedule, async () => {
            const traceId = generateTraceId();
            logger.info("Starting medical records processing cron job", {
                traceId,
                method: "CronService.scheduleMedicalRecordsProcessing",
            });

            try {
                await this.triggerMedicalRecordsProcessing(traceId);
                logger.info("Medical records processing cron job completed", {
                    traceId,
                    method: "CronService.scheduleMedicalRecordsProcessing",
                });
            } catch (error) {
                logger.error("Medical records processing cron job failed", {
                    traceId,
                    error: error,
                    method: "CronService.scheduleMedicalRecordsProcessing",
                });
            }
        });

        this.jobs.set("medicalRecordsProcessing", job);

        logger.info("Scheduled medical records processing cron job", {
            method: "CronService.scheduleMedicalRecordsProcessing",
            schedule,
            runImmediately,
        });
    }

    private schedulePendingDNAFilesProcessing(): void {
        const schedule = "0 0 * * *";
        const runImmediately = true;

        if (runImmediately) {
            const traceId = generateTraceId();
            logger.info("Running pending DNA files processing immediately on startup", {
                traceId,
                method: "CronService.schedulePendingDNAFilesProcessing",
            });

            this.triggerPendingDNAFilesProcessing(traceId).catch((error) => {
                logger.error("Pending DNA files processing failed on startup", {
                    traceId,
                    error: error,
                    method: "CronService.schedulePendingDNAFilesProcessing",
                });
            });
        }

        const job = cron.schedule(schedule, async () => {
            const traceId = generateTraceId();
            logger.info("Starting pending DNA files processing cron job", {
                traceId,
                method: "CronService.schedulePendingDNAFilesProcessing",
            });

            try {
                await this.triggerPendingDNAFilesProcessing(traceId);
                logger.info("Pending DNA files processing cron job completed", {
                    traceId,
                    method: "CronService.schedulePendingDNAFilesProcessing",
                });
            } catch (error) {
                logger.error("Pending DNA files processing cron job failed", {
                    traceId,
                    error: error,
                    method: "CronService.schedulePendingDNAFilesProcessing",
                });
            }
        });

        this.jobs.set("pendingDNAFilesProcessing", job);

        logger.info("Scheduled pending DNA files processing cron job", {
            method: "CronService.schedulePendingDNAFilesProcessing",
            schedule,
            runImmediately,
        });
    }

    async triggerMedicalRecordsProcessing(traceId?: string): Promise<void> {
        const id = traceId || generateTraceId();
        logger.info("Manually triggering medical records processing", {
            traceId: id,
            method: "CronService.triggerMedicalRecordsProcessing",
        });

        try {
            await medicalRecordProcessorService.processUnprocessedRecords(id);
            logger.info("Medical records processing completed", {
                traceId: id,
                method: "CronService.triggerMedicalRecordsProcessing",
            });
        } catch (error) {
            logger.error("Medical records processing failed", {
                traceId: id,
                error: error,
                method: "CronService.triggerMedicalRecordsProcessing",
            });
            throw error;
        }
    }

    async triggerPendingDNAFilesProcessing(traceId?: string): Promise<void> {
        const id = traceId || generateTraceId();
        logger.info("Manually triggering pending DNA files processing", {
            traceId: id,
            method: "CronService.triggerPendingDNAFilesProcessing",
        });

        try {
            await pendingDNAFileProcessorService.processPendingFiles(id);
            logger.info("Pending DNA files processing completed", {
                traceId: id,
                method: "CronService.triggerPendingDNAFilesProcessing",
            });
        } catch (error) {
            logger.error("Pending DNA files processing failed", {
                traceId: id,
                error: error,
                method: "CronService.triggerPendingDNAFilesProcessing",
            });
            throw error;
        }
    }
}

export const cronService = new CronService();
export default cronService;


