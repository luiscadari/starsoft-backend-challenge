import { SQS } from 'aws-sdk';

export const sqs = new SQS({
  endpoint: 'http://localhost:9324',
  accessKeyId: 'na',
  secretAccessKey: 'na',
  region: 'us-east-1',
});
