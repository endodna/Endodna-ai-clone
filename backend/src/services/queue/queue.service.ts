import { logger } from "../../helpers/logger.helper";
import sqsHelper from "../../helpers/aws/sqs.helper";
import tempusService from "../tempus.service";

class QueueService {
    initializePolling(): void {
        this.initializeFileProcessingPolling();
        this.initializeTempusLabPolling();
    }

    private initializeFileProcessingPolling(): void {
        const queueUrl = process.env.SQS_PROCESSING_QUEUE_URL;

        if (!queueUrl) {
            logger.warn(
                "SQS_PROCESSING_QUEUE_URL not configured, skipping file processing queue polling initialization",
            );
            return;
        }

        logger.info("Initializing SQS polling for file processing queue", {
            queueUrl,
        });

        sqsHelper.startPolling({
            queueUrl,
            maxNumberOfMessages: 10,
            waitTimeSeconds: 20,
            onMessage: async (message) => {
                try {
                    const data = JSON.parse(message.body);
                    logger.info("Processing SQS message from file processing queue", {
                        messageId: message.messageId,
                        data,
                    });
                    if (data.bucket && data.key) {
                        await tempusService.processDNAFile({
                            bucket: data.bucket,
                            key: data.key,
                            traceId: message.messageId,
                        });
                    } else {
                        logger.warn("Tempus Lab message missing bucket or key", {
                            messageId: message.messageId,
                            data,
                        });
                    }
                } catch (error) {
                    logger.error("Error processing file processing SQS message", {
                        messageId: message.messageId,
                        error: error,
                    });
                    throw error;
                }
            },
            onError: (error) => {
                logger.error("File processing SQS polling error", {
                    queueUrl,
                    error: error,
                });
            },
        });
    }

    private initializeTempusLabPolling(): void {
        const queueUrl = process.env.SQS_TEMPUS_LAB_QUEUE_URL;

        if (!queueUrl) {
            logger.warn(
                "SQS_TEMPUS_LAB_QUEUE_URL not configured, skipping Tempus Lab queue polling initialization",
            );
            return;
        }

        logger.info("Initializing SQS polling for Tempus Lab queue", {
            queueUrl,
        });

        sqsHelper.startPolling({
            queueUrl,
            maxNumberOfMessages: 10,
            waitTimeSeconds: 20,
            onMessage: async (message) => {
                try {
                    const data = JSON.parse(message.body);
                    logger.info("Processing SQS message from Tempus Lab", {
                        messageId: message.messageId,
                        data,
                    });

                    if (data.sample_id && data.status) {
                        await tempusService.updateKitStatus({
                            sampleId: data.sample_id,
                            status: data.status,
                            timestamp: data.timestamp || new Date().toISOString(),
                            comment: data.comment || "",
                            traceId: message.messageId,
                        });
                    } else {
                        logger.warn("Tempus Lab message missing sample_id or status", {
                            messageId: message.messageId,
                            data,
                        });
                    }
                } catch (error) {
                    logger.error("Error processing Tempus Lab SQS message", {
                        messageId: message.messageId,
                        error: error,
                    });
                    throw error;
                }
            },
            onError: (error) => {
                logger.error("Tempus Lab SQS polling error", {
                    queueUrl,
                    error: error,
                });
            },
        });
    }

    private stopFileProcessingPolling(): void {
        const queueUrl = process.env.SQS_PROCESSING_QUEUE_URL;

        if (queueUrl) {
            sqsHelper.stopPolling(queueUrl);
            logger.info("Stopped SQS polling for file processing queue", {
                queueUrl,
            });
        }
    }

    private stopTempusLabPolling(): void {
        const queueUrl = process.env.SQS_TEMPUS_LAB_QUEUE_URL;

        if (queueUrl) {
            sqsHelper.stopPolling(queueUrl);
            logger.info("Stopped SQS polling for Tempus Lab queue", {
                queueUrl,
            });
        }
    }

    stopAllPolling(): void {
        this.stopFileProcessingPolling();
        this.stopTempusLabPolling();
        logger.info("Stopped all SQS polling instances");
    }
}

const queueService = new QueueService();
export default queueService;

