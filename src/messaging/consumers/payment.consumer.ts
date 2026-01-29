// src/messaging/consumers/payment.consumer.ts
import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PaymentConfirmedEvent } from '../events';
import { ReservationService } from '../../reservation/reservation.service';
import { TicketService } from '../../ticket/ticket.service';

@Injectable()
export class PaymentConsumer {
  private readonly logger = new Logger(PaymentConsumer.name);

  constructor(
    private readonly reservationService: ReservationService,
    private readonly ticketService: TicketService,
  ) {}

  @EventPattern('payment.confirmed')
  async handlePaymentConfirmed(@Payload() event: PaymentConfirmedEvent) {
    this.logger.log(
      `Processing payment confirmation: ${event.data.reservationId}`,
    );

    try {
      // 1. Atualizar status da reserva para confirmada
      await this.reservationService.confirmReservation(
        event.data.reservationId,
        event.data.paymentId,
      );

      // 2. Gerar ingresso
      await this.ticketService.createTicketFromReservation(
        event.data.reservationId,
      );

      this.logger.log(
        `Successfully processed payment for reservation: ${event.data.reservationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process payment confirmation: ${event.data.reservationId}`,
        error.stack,
      );
      // Em produção, enviar para DLQ
      throw error;
    }
  }
}
