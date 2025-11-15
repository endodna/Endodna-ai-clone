import { SQSClient } from "@aws-sdk/client-sqs";
import { CloudWatchLogsClient } from "@aws-sdk/client-cloudwatch-logs";
import { S3Client } from "@aws-sdk/client-s3";
import { SESClient } from "@aws-sdk/client-ses";
import { logger } from "../helpers/logger.helper";
import { NodeHttpHandler } from "@aws-sdk/node-http-handler";
import https from "https";

class AWSHandler {
  private sqsClient: SQSClient | null = null;
  private cloudWatchLogsClient: CloudWatchLogsClient | null = null;
  private s3Client: S3Client | null = null;
  private sesClient: SESClient | null = null;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || "us-east-1";

    this.initializeSQS();
    this.initializeCloudWatchLogs();
    this.initializeS3();
    this.initializeSES();
  }

  private createHttpAgent() {
    return new https.Agent({
      keepAlive: true,
      keepAliveMsecs: 30000,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 60000,
      scheduling: "fifo" as any,
    });
  }

  private initializeSQS(): void {
    try {
      const httpAgent = this.createHttpAgent();
      const requestHandler = new NodeHttpHandler({
        httpsAgent: httpAgent,
        connectionTimeout: 5000,
        socketTimeout: 60000,
      });

      this.sqsClient = new SQSClient({
        region: this.region,
        requestHandler,
        maxAttempts: 3,
      });

      logger.info("AWS SQS Client initialized", {
        region: this.region,
      });
    } catch (error) {
      logger.error("Failed to initialize AWS SQS Client", {
        error: error,
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

  private initializeS3(): void {
    try {
      const httpAgent = this.createHttpAgent();
      const requestHandler = new NodeHttpHandler({
        httpsAgent: httpAgent,
        connectionTimeout: 5000,
        socketTimeout: 60000,
      });

      this.s3Client = new S3Client({
        region: this.region,
        requestHandler,
        maxAttempts: 3,
      });

      logger.info("AWS S3 Client initialized", {
        region: this.region,
      });
    } catch (error) {
      logger.error("Failed to initialize AWS S3 Client", {
        error: error,
        region: this.region,
      });
    }
  }

  getS3Client(): S3Client {
    if (!this.s3Client) {
      this.initializeS3();
      if (!this.s3Client) {
        throw new Error("S3 client failed to initialize");
      }
    }
    return this.s3Client;
  }

  private initializeSES(): void {
    try {
      const httpAgent = this.createHttpAgent();
      const requestHandler = new NodeHttpHandler({
        httpsAgent: httpAgent,
        connectionTimeout: 5000,
        socketTimeout: 60000,
      });

      this.sesClient = new SESClient({
        region: this.region,
        requestHandler,
        maxAttempts: 3,
      });

      logger.info("AWS SES Client initialized", {
        region: this.region,
      });
    } catch (error) {
      logger.error("Failed to initialize AWS SES Client", {
        error: error,
        region: this.region,
      });
    }
  }

  getSESClient(): SESClient {
    if (!this.sesClient) {
      this.initializeSES();
      if (!this.sesClient) {
        throw new Error("SES client failed to initialize");
      }
    }
    return this.sesClient;
  }

  getRegion(): string {
    return this.region;
  }
}

export const aws = new AWSHandler();
export default aws;
