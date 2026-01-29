// src/messaging/consumers/payment.consumer.ts
import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import type { PaymentConfirmedEvent } from '../events';
import { ReservationService } from '../../services/reservation.service';

@Injectable()
export class PaymentConsumer {
  private readonly logger = new Logger(PaymentConsumer.name);

  constructor(private readonly reservationService: ReservationService) {}

  @EventPattern('payment.confirmed')
  async handlePaymentConfirmed(@Payload() event: PaymentConfirmedEvent) {
    this.logger.log(
      `Processing payment confirmation: ${event.data.reservationId}`,
    );

    try {
      // 1. Atualizar status da reserva para confirmada
      await this.reservationService.confirmPayment(
        event.data.reservationId,
        event.data.paymentId,
      );

      this.logger.log(
        `Successfully processed payment for reservation: ${event.data.reservationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process payment confirmation: ${event.data.reservationId}`,
        error,
      );
      // Em produção, enviar para DLQ
      throw error;
    }
  }
}
