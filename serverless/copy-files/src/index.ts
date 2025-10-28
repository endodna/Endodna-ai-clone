import { S3Event } from 'aws-lambda';
import { S3Client, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({});

interface LambdaResponse {
  statusCode: number;
  body: string;
}

export const handler = async (event: S3Event): Promise<LambdaResponse> => {
  console.log('Received S3 event:', JSON.stringify(event, null, 2));

  const privateBucket = process.env.PRIVATE_BUCKET;

  if (!privateBucket) {
    throw new Error('Missing environment variable: PRIVATE_BUCKET');
  }

  const results = [];

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Copying file from DMZ: ${bucket}/${key}`);

    try {
      const copyCommand = new CopyObjectCommand({
        CopySource: `${bucket}/${key}`,
        Bucket: privateBucket,
        Key: key
      });

      await s3Client.send(copyCommand);
      console.log(`Successfully copied ${key} to private bucket`);

      // Delete file from DMZ after successful copy
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key
      });

      await s3Client.send(deleteCommand);
      console.log(`Successfully deleted ${key} from DMZ bucket`);

      results.push({ key, status: 'success' });

    } catch (error) {
      console.error(`Error processing ${key}:`, error);
      results.push({
        key,
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
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


