import {
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { logger } from "./logger.helper";
import aws from "../lib/aws";

export interface SQSMessage {
  messageId: string;
  receiptHandle: string;
  body: string;
  attributes?: Record<string, string>;
  messageAttributes?: Record<string, any>;
}

export interface SQSPollingOptions {
  queueUrl: string;
  maxNumberOfMessages?: number; 
  waitTimeSeconds?: number; // 0-20, default 0 (short polling)
  visibilityTimeoutSeconds?: number; // default queue visibility timeout
  messageAttributeNames?: string[];
  attributeNames?: string[]; 
  onMessage?: (message: SQSMessage) => Promise<void>;
  onError?: (error: Error) => void;
  // Exponential backoff options
  baseIntervalMs?: number; //  (default: 1000ms)
  maxBackoffIntervalMs?: number; // Maximum backoff interval (default: 300000ms = 5 minutes)
  backoffMultiplier?: number; // Backoff multiplier (default: 2)
  enableExponentialBackoff?: boolean; // Enable exponential backoff (default: true)
}

class SQSHelper {
  private pollingInstances: Map<string, NodeJS.Timeout | null> = new Map();
  private isPolling: Map<string, boolean> = new Map();
  private consecutiveEmptyReceives: Map<string, number> = new Map();
  private currentBackoffInterval: Map<string, number> = new Map();


  private convertMessage(message: Message): SQSMessage {
    return {
      messageId: message.MessageId || "",
      receiptHandle: message.ReceiptHandle || "",
      body: message.Body || "",
      attributes: message.Attributes,
      messageAttributes: message.MessageAttributes,
    };
  }

  /**
   * Poll SQS queue once and process messages
   */
  async pollOnce(options: SQSPollingOptions): Promise<SQSMessage[]> {
    const {
      queueUrl,
      maxNumberOfMessages = 1,
      waitTimeSeconds = 0,
      visibilityTimeoutSeconds,
      messageAttributeNames = ["All"],
    } = options;

    const sqsClient: SQSClient = aws.getSQSClient();

    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: Math.min(Math.max(maxNumberOfMessages, 1), 10),
        WaitTimeSeconds: Math.min(Math.max(waitTimeSeconds, 0), 20),
        VisibilityTimeout: visibilityTimeoutSeconds,
        MessageAttributeNames: messageAttributeNames,
      });

      const response = await sqsClient.send(command);

      if (!response.Messages || response.Messages.length === 0) {
        // Increment empty receive counter for exponential backoff
        const currentEmptyCount = this.consecutiveEmptyReceives.get(queueUrl) || 0;
        this.consecutiveEmptyReceives.set(queueUrl, currentEmptyCount + 1);
        
        logger.debug("Empty SQS receive", {
          queueUrl,
          consecutiveEmptyReceives: currentEmptyCount + 1,
        });
        
        return [];
      }

      // Reset empty receive counter when messages are found
      this.consecutiveEmptyReceives.set(queueUrl, 0);

      const messages: SQSMessage[] = response.Messages.map((msg) =>
        this.convertMessage(msg),
      );

      logger.info(`Received ${messages.length} message(s) from SQS queue`, {
        queueUrl,
        messageCount: messages.length,
      });

      return messages;
    } catch (error) {
      logger.error("Error polling SQS queue", {
        queueUrl,
        error: error,
      });

      if (options.onError) {
        options.onError(
          error instanceof Error ? error : new Error(String(error)),
        );
      }

      throw error;
    }
  }

  /**
   * Calculate next poll interval with exponential backoff
   */
  private calculateNextPollInterval(
    queueUrl: string,
    baseIntervalMs: number,
    maxBackoffIntervalMs: number,
    backoffMultiplier: number,
    enableBackoff: boolean,
  ): number {
    if (!enableBackoff) {
      return baseIntervalMs;
    }

    const emptyReceives = this.consecutiveEmptyReceives.get(queueUrl) || 0;

    // If no empty receives, use base interval
    if (emptyReceives === 0) {
      this.currentBackoffInterval.set(queueUrl, baseIntervalMs);
      return baseIntervalMs;
    }

    // Calculate exponential backoff: baseInterval * (multiplier ^ emptyReceives)
    const backoffInterval = Math.min(
      baseIntervalMs * Math.pow(backoffMultiplier, emptyReceives),
      maxBackoffIntervalMs,
    );

    this.currentBackoffInterval.set(queueUrl, backoffInterval);

    return backoffInterval;
  }

  /**
   * Start continuous polling of SQS queue with exponential backoff
   */
  startPolling(
    options: SQSPollingOptions,
    pollIntervalMs: number = 1000,
  ): void {
    const {
      queueUrl,
      onMessage,
      onError,
      baseIntervalMs = pollIntervalMs,
      maxBackoffIntervalMs = 300000, // 5 minutes max (300 seconds)
      backoffMultiplier = 2,
      enableExponentialBackoff = true,
    } = options;

    if (this.isPolling.get(queueUrl)) {
      logger.warn(`Polling already active for queue: ${queueUrl}`);
      return;
    }

    // Initialize backoff tracking for this queue
    this.consecutiveEmptyReceives.set(queueUrl, 0);
    this.currentBackoffInterval.set(queueUrl, baseIntervalMs);

    this.isPolling.set(queueUrl, true);

    logger.info(`Starting SQS polling for queue: ${queueUrl}`, {
      queueUrl,
      baseIntervalMs,
      maxBackoffIntervalMs,
      backoffMultiplier,
      enableExponentialBackoff,
    });

    const poll = async () => {
      if (!this.isPolling.get(queueUrl)) {
        return;
      }

      try {
        const messages = await this.pollOnce(options);

        // Reset backoff when messages are received
        if (messages.length > 0) {
          this.consecutiveEmptyReceives.set(queueUrl, 0);
          this.currentBackoffInterval.set(queueUrl, baseIntervalMs);
        }

        // Process each message
        for (const message of messages) {
          try {
            if (onMessage) {
              await onMessage(message);
            }

            // Delete message after successful processing
            await this.deleteMessage(queueUrl, message.receiptHandle);
          } catch (error) {
            logger.error("Error processing SQS message", {
              queueUrl,
              messageId: message.messageId,
              error: error,
            });

            if (onError) {
              onError(
                error instanceof Error ? error : new Error(String(error)),
              );
            }
          }
        }
      } catch (error) {
        logger.error("Error during SQS polling cycle", {
          queueUrl,
          error: error,
        });

        if (onError) {
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      }

      // Calculate next poll interval with exponential backoff
      const nextInterval = this.calculateNextPollInterval(
        queueUrl,
        baseIntervalMs,
        maxBackoffIntervalMs,
        backoffMultiplier,
        enableExponentialBackoff,
      );

      const emptyReceives = this.consecutiveEmptyReceives.get(queueUrl) || 0;
      
      if (emptyReceives > 0 && enableExponentialBackoff) {
        logger.debug(`Using exponential backoff for next poll`, {
          queueUrl,
          nextIntervalMs: nextInterval,
          consecutiveEmptyReceives: emptyReceives,
        });
      }

      // Schedule next poll if still active
      if (this.isPolling.get(queueUrl)) {
        const timeoutId = setTimeout(poll, nextInterval);
        this.pollingInstances.set(queueUrl, timeoutId);
      }
    };

    poll();
  }

  /**
   * Stop polling a specific queue
   */
  stopPolling(queueUrl: string): void {
    const timeoutId = this.pollingInstances.get(queueUrl);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.pollingInstances.set(queueUrl, null);
    }

    this.isPolling.set(queueUrl, false);
    
    // Clean up backoff tracking
    this.consecutiveEmptyReceives.delete(queueUrl);
    this.currentBackoffInterval.delete(queueUrl);

    logger.info(`Stopped SQS polling for queue: ${queueUrl}`, {
      queueUrl,
    });
  }

  /**
   * Stop all polling instances
   */
  stopAllPolling(): void {
    for (const [queueUrl] of this.isPolling) {
      this.stopPolling(queueUrl);
    }
  }

  /**
   * Delete a message from SQS queue after processing
   */
  async deleteMessage(
    queueUrl: string,
    receiptHandle: string,
  ): Promise<void> {
    const sqsClient: SQSClient = aws.getSQSClient();

    try {
      const command = new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      });

      await sqsClient.send(command);

      logger.debug("Deleted message from SQS queue", {
        queueUrl,
        receiptHandle,
      });
    } catch (error) {
      logger.error("Error deleting message from SQS queue", {
        queueUrl,
        receiptHandle,
        error: error,
      });
      throw error;
    }
  }

  /**
   * Check if polling is active for a queue
   */
  isPollingActive(queueUrl: string): boolean {
    return this.isPolling.get(queueUrl) === true;
  }
}

export const sqsHelper = new SQSHelper();
export default sqsHelper;

