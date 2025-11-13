import { logger } from "../../helpers/logger.helper";
import s3Helper from "../../helpers/aws/s3.helper";
import tempusService from "../tempus.service";

class PendingDNAFileProcessorService {
    async processPendingFiles(traceId?: string): Promise<void> {
        try {
            const bucket = process.env.S3_LAB_PROCESSING_BUCKET;

            if (!bucket) {
                logger.error("S3 bucket not configured for pending DNA file processing", {
                    traceId,
                    method: "PendingDNAFileProcessorService.processPendingFiles",
                });
                throw new Error("S3 bucket not configured");
            }

            logger.info("Listing pending DNA files", {
                traceId,
                bucket,
                method: "PendingDNAFileProcessorService.processPendingFiles",
            });

            const pendingFiles = await s3Helper.listFiles(bucket, "pending/", undefined, traceId);

            if (pendingFiles.length === 0) {
                logger.info("No pending DNA files found", {
                    traceId,
                    bucket,
                    method: "PendingDNAFileProcessorService.processPendingFiles",
                });
                return;
            }

            logger.info(`Found ${pendingFiles.length} pending DNA file(s) to process`, {
                traceId,
                bucket,
                fileCount: pendingFiles.length,
                method: "PendingDNAFileProcessorService.processPendingFiles",
            });

            const results: Array<{ key: string; success: boolean; error?: string }> = [];

            for (const key of pendingFiles) {
                try {
                    logger.info("Processing pending DNA file", {
                        traceId,
                        bucket,
                        key,
                        method: "PendingDNAFileProcessorService.processPendingFiles",
                    });

                    await tempusService.processDNAFile({
                        bucket,
                        key,
                        traceId,
                    });

                    results.push({ key, success: true });

                    logger.info("Successfully processed pending DNA file", {
                        traceId,
                        bucket,
                        key,
                        method: "PendingDNAFileProcessorService.processPendingFiles",
                    });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    logger.error("Error processing pending DNA file", {
                        traceId,
                        bucket,
                        key,
                        error: error,
                        method: "PendingDNAFileProcessorService.processPendingFiles",
                    });

                    results.push({
                        key,
                        success: false,
                        error: errorMessage,
                    });
                }

                await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            const successful = results.filter((r) => r.success).length;
            const failed = results.length - successful;

            logger.info("Pending DNA files processing completed", {
                traceId,
                bucket,
                total: pendingFiles.length,
                successful,
                failed,
                method: "PendingDNAFileProcessorService.processPendingFiles",
            });
        } catch (error) {
            logger.error("Error processing pending DNA files", {
                traceId,
                error: error,
                method: "PendingDNAFileProcessorService.processPendingFiles",
            });
            throw error;
        }
    }
}

export const pendingDNAFileProcessorService = new PendingDNAFileProcessorService();
export default pendingDNAFileProcessorService;

