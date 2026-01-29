// src/messaging/bull.module.ts
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false, // Manter jobs falhados para análise
          attempts: 3, // Tentar 3 vezes
          backoff: {
            type: 'exponential',
            delay: 2000, // 2 segundos inicial, depois exponencial
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'expiration',
    }),
  ],
  exports: [BullModule],
})
export class BullConfigModule {}
