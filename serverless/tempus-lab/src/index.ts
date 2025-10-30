import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Received API Gateway event:', JSON.stringify(event, null, 2));

  const queueUrl = process.env.SQS_QUEUE_URL;

  if (!queueUrl) {
    console.error('Missing environment variable: SQS_QUEUE_URL');
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error: SQS queue not configured'
      })
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const payload = {
      ...body,
      timestamp: new Date().toISOString(),
      source: 'tempus-lab',
      headers: event.headers,
      requestContext: {
        requestId: event.requestContext?.requestId,
        httpMethod: event.httpMethod,
        path: event.path,
      }
    };

    console.log('Sending message to SQS:', JSON.stringify(payload, null, 2));

    const sqsCommand = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(payload)
    });

    await sqsClient.send(sqsCommand);
    console.log('Successfully sent message to SQS');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: 'Success',
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error processing request:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      })
    };
  }
};

