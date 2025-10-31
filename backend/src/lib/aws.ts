import { SQSClient } from "@aws-sdk/client-sqs";
import { CloudWatchLogsClient } from "@aws-sdk/client-cloudwatch-logs";
import { logger } from "../helpers/logger.helper";

class AWSHandler {
  private sqsClient: SQSClient | null = null;
  private cloudWatchLogsClient: CloudWatchLogsClient | null = null;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || "us-east-1";

    this.initializeSQS();
    this.initializeCloudWatchLogs();
  }

  private initializeSQS(): void {
    try {
      this.sqsClient = new SQSClient({
        region: this.region,
      });

      logger.info("AWS SQS Client initialized", {
        region: this.region,
      });
    } catch (error) {
      logger.error("Failed to initialize AWS SQS Client", {
        error: error instanceof Error ? error.message : String(error),
        region: this.region,
      });
    }
  }

  private initializeCloudWatchLogs(): void {
    try {
      this.cloudWatchLogsClient = new CloudWatchLogsClient({
        region: this.region,
      });
    } catch (_error) {
      // Silently fail - CloudWatch Logs is optional
      // Logger will fall back to console if CloudWatch fails
    }
  }

  getSQSClient(): SQSClient {
    if (!this.sqsClient) {
      this.initializeSQS();
      if (!this.sqsClient) {
        throw new Error("SQS client failed to initialize");
      }
    }
    return this.sqsClient;
  }

  getCloudWatchLogsClient(): CloudWatchLogsClient | null {
    if (!this.cloudWatchLogsClient) {
      this.initializeCloudWatchLogs();
    }
    return this.cloudWatchLogsClient;
  }

  getRegion(): string {
    return this.region;
  }
}

export const aws = new AWSHandler();
export default aws;

