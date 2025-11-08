import * as cron from "node-cron";
import { logger } from "../../helpers/logger.helper";
import { generateTraceId } from "../../helpers/misc.helper";
import medicalRecordProcessorService from "./medicalRecordProcessor.service";

class CronService {
    private jobs: Map<string, cron.ScheduledTask> = new Map();

    async initialize(): Promise<void> {
        logger.info("Initializing cron jobs", {
            method: "CronService.initialize",
        });

        const runImmediately = process.env.RUN_MEDICAL_RECORDS_PROCESSING_ON_START === "true";

        if (runImmediately) {
            const traceId = generateTraceId();
            logger.info("Running medical records processing immediately on startup", {
                traceId,
                method: "CronService.initialize",
            });

            medicalRecordProcessorService.processUnprocessedRecords(traceId).catch((error) => {
                logger.error("Medical records processing failed on startup", {
                    traceId,
                    error: error,
                    method: "CronService.initialize",
                });
            });
        }

        this.scheduleMedicalRecordsProcessing();

        logger.info("Cron jobs initialized", {
            method: "CronService.initialize",
            jobCount: this.jobs.size,
            runImmediately,
        });
    }

    private scheduleMedicalRecordsProcessing(): void {
        const schedule = process.env.MEDICAL_RECORDS_PROCESSING_CRON || "*/5 * * * *";

        const job = cron.schedule(schedule, async () => {
            const traceId = generateTraceId();
            logger.info("Starting medical records processing cron job", {
                traceId,
                method: "CronService.scheduleMedicalRecordsProcessing",
            });

            try {
                await medicalRecordProcessorService.processUnprocessedRecords(traceId);
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
}

export const cronService = new CronService();
export default cronService;

