// src/messaging/messaging.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MessagingService } from './messaging.service';
import { PaymentConsumer } from './consumers/payment.consumer';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'MESSAGING_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('RABBITMQ_URL')],
            queue: 'ticket_queue',
            queueOptions: {
              durable: true,
            },
            prefetchCount: 1, // Processa uma mensagem por vez
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [MessagingService, PaymentConsumer],
  exports: [MessagingService],
})
export class MessagingModule {}
