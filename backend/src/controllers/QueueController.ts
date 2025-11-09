import { logger } from "../helpers/logger.helper";
import sqsHelper from "../helpers/aws/sqs.helper";
import tempusService from "../services/tempus.service";

class QueueController {
  public static initializePolling(): void {
    this.initializeFileProcessingPolling();
    this.initializeTempusLabPolling();
  }

  private static initializeFileProcessingPolling(): void {
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
      waitTimeSeconds: 20, // Long polling (0-20 seconds)
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

  private static initializeTempusLabPolling(): void {
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

  private static stopFileProcessingPolling(): void {
    const queueUrl = process.env.SQS_PROCESSING_QUEUE_URL;

    if (queueUrl) {
      sqsHelper.stopPolling(queueUrl);
      logger.info("Stopped SQS polling for file processing queue", {
        queueUrl,
      });
    }
  }

  private static stopTempusLabPolling(): void {
    const queueUrl = process.env.SQS_TEMPUS_LAB_QUEUE_URL;

    if (queueUrl) {
      sqsHelper.stopPolling(queueUrl);
      logger.info("Stopped SQS polling for Tempus Lab queue", {
        queueUrl,
      });
    }
  }

  public static stopAllPolling(): void {
    this.stopFileProcessingPolling();
    this.stopTempusLabPolling();
    logger.info("Stopped all SQS polling instances");
  }
}

export default QueueController;
