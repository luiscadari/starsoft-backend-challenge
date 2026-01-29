import { sqs } from '../config/sqsClient';
import { Chair } from '../models/chairs.models';

export class QueueService {
  private readonly sqsClient = sqs;
  private readonly queueUrl = process.env.QUEUE_URL;
  constructor() {
    if (!this.queueUrl) {
      throw new Error('QUEUE_URL is not defined');
    }
  }
  async addToQueue({
    chair,
    reservationId,
  }: {
    chair: Chair;
    reservationId: string;
  }): Promise<void> {
    const params = {
      MessageBody: JSON.stringify({
        chairId: chair.id,
        reservationId: reservationId,
      }),
      QueueUrl: this.queueUrl!, // Non-null assertion since we check in constructor
    };
    try {
      await this.sqsClient.sendMessage(params).promise();
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
  async processMessages() {
    const maxNumberOfMessages = 10;
    try {
      const data = await this.sqsClient
        .receiveMessage({
          QueueUrl: this.queueUrl!,
          MaxNumberOfMessages: maxNumberOfMessages,
          WaitTimeSeconds: 20,
        })
        .promise();
      if (data.Messages && data.Messages.length > 0) {
        for (const message of data.Messages) {
          console.log('Processing message:', message.Body);
        }
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}
