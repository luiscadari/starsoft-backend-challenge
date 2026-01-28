import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface ReservationCreatedEvent {
  reservationIds: number[];
  sessionId: number;
  chairIds: number[];
  userId: number;
  expiresAt: Date;
}

export interface PaymentConfirmedEvent {
  reservationIds: number[];
  saleIds: number[];
  sessionId: number;
  userId: number;
  totalValue: number;
}

export interface ReservationExpiredEvent {
  reservationId: number;
  sessionId: number;
  chairId: number;
}

export interface ChairReleasedEvent {
  chairId: number;
  sessionId: number;
}

@Injectable()
export class EventEmitterService {
  private readonly logger = new Logger(EventEmitterService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  emitReservationCreated(event: ReservationCreatedEvent): void {
    this.logger.log(
      `Emitindo evento: reservation.created - IDs: ${event.reservationIds.join(', ')}`,
    );
    this.eventEmitter.emit('reservation.created', event);
  }

  emitPaymentConfirmed(event: PaymentConfirmedEvent): void {
    this.logger.log(
      `Emitindo evento: payment.confirmed - Vendas: ${event.saleIds.join(', ')}`,
    );
    this.eventEmitter.emit('payment.confirmed', event);
  }

  emitReservationExpired(event: ReservationExpiredEvent): void {
    this.logger.log(
      `Emitindo evento: reservation.expired - ID: ${event.reservationId}`,
    );
    this.eventEmitter.emit('reservation.expired', event);
  }

  emitChairReleased(event: ChairReleasedEvent): void {
    this.logger.log(
      `Emitindo evento: chair.released - Assento: ${event.chairId}`,
    );
    this.eventEmitter.emit('chair.released', event);
  }
}
