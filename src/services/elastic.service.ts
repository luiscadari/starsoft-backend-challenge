import { AWSError, SQS } from 'aws-sdk';

class ElasticService {
  private readonly sqsClient: SQS;

  constructor() {
    this.sqsClient = new SQS({
      endpoint: 'http://localhost:9324',
      accessKeyId: 'na',
      secretAccessKey: 'na',
      region: 'us-east-1',
    });
  }

  async createQueueIfNotExists() {
    const queueName =
      process.env.QUEUE_NAME || 'payment-and-reservations-requests';

    try {
      // Tenta obter a URL da fila (para verificar se existe)
      const data = await this.sqsClient
        .getQueueUrl({ QueueName: queueName })
        .promise();
      console.log(`Fila já existe: ${data.QueueUrl}`);
      process.env.QUEUE_URL = data.QueueUrl;
    } catch (error) {
      const awsError = error as AWSError;
      if (awsError.code === 'QueueDoesNotExist') {
        // Se não existir, cria a fila
        console.log(`Criando fila: ${queueName}`);

        const params = {
          QueueName: queueName,
          Attributes: {
            DelaySeconds: '0',
            MessageRetentionPeriod: '345600', // 4 dias
            VisibilityTimeout: '30',
            ReceiveMessageWaitTimeSeconds: '0',
          },
        };
        const data = await this.sqsClient.createQueue(params).promise();
        console.log(`Fila criada com sucesso: ${data.QueueUrl}`);

        process.env.QUEUE_URL = data.QueueUrl
          ? data.QueueUrl.replaceAll(
              'http://localhost:9324',
              'http://elasticmq:9324',
            )
          : undefined;
        if (!process.env.QUEUE_URL) {
          throw new Error('Failed to set QUEUE_URL environment variable');
        }
      } else {
        console.log(awsError);
        throw awsError;
      }
    }
  }
}

export const elasticService = new ElasticService();
