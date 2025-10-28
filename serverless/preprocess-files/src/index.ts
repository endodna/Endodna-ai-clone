import { S3Event } from 'aws-lambda';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const s3Client = new S3Client({});
const sqsClient = new SQSClient({});

interface MessagePayload {
  bucket: string;
  key: string;
  source: string;
  timestamp: string;
  processedAt: string;
  [key: string]: any;
}

interface LambdaResponse {
  statusCode: number;
  body: string;
}

export const handler = async (event: S3Event): Promise<LambdaResponse> => {
  console.log('Received S3 event from private bucket:', JSON.stringify(event, null, 2));

  const queueUrl = process.env.SQS_QUEUE_URL;

  if (!queueUrl) {
    throw new Error('Missing environment variable: SQS_QUEUE_URL');
  }

  const results = [];

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing file: ${bucket}/${key}`);

    try {
      const headCommand = new HeadObjectCommand({
        Bucket: bucket,
        Key: key
      });

      const metadata = await s3Client.send(headCommand);

      const payload: MessagePayload = {
        bucket,
        key,
        source: 'private-bucket',
        timestamp: metadata.LastModified?.toISOString() || new Date().toISOString(),
        processedAt: new Date().toISOString(),
        size: metadata.ContentLength,
        contentType: metadata.ContentType,
        etag: metadata.ETag,
      };

      console.log(`Preprocessed ${key}:`, JSON.stringify(payload, null, 2));

      const sqsCommand = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(payload)
      });

      await sqsClient.send(sqsCommand);
      console.log(`Successfully sent message to SQS for ${key}`);

      results.push({ key, status: 'success', payload });

    } catch (error) {
      console.error(`Error preprocessing ${key}:`, error);
      results.push({
        key,
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Processed ${results.length} file(s)`,
      results
    })
  };
};


