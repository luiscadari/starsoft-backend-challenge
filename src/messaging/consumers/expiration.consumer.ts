// src/messaging/consumers/expiration.consumer.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ReservationExpiredEvent } from '../events';
import { SeatService } from '../../seat/seat.service';

@Processor('expiration')
@Injectable()
export class ExpirationConsumer {
  private readonly logger = new Logger(ExpirationConsumer.name);

  constructor(private readonly seatService: SeatService) {}

  @Process('reservation.expired')
  async handleReservationExpired(job: Job<ReservationExpiredEvent>) {
    const { data } = job.data;

    this.logger.log(`Processing expired reservation: ${data.reservationId}`);

    try {
      // Liberar assentos reservados
      await this.seatService.releaseSeats(
        data.sessionId,
        data.seatNumbers,
        data.reservationId,
      );

      this.logger.log(
        `Successfully released seats for reservation: ${data.reservationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process expired reservation: ${data.reservationId}`,
        error.stack,
      );
      throw error; // O Bull vai tentar novamente
    }
  }

  @OnQueueFailed()
  handleFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
  }
}
