// src/messaging/messaging.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';
import {
  EventType,
  PaymentConfirmedEvent,
  ReservationCreatedEvent,
  ReservationExpiredEvent,
} from './events';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    @Inject('MESSAGING_SERVICE') private readonly client: ClientProxy,
  ) {}

  publishReservationCreated(data: ReservationCreatedEvent['data']) {
    const event: ReservationCreatedEvent = {
      id: uuidv4(),
      type: EventType.RESERVATION_CREATED,
      timestamp: new Date(),
      data,
    };

    this.client.emit(EventType.RESERVATION_CREATED, event);
    this.logger.log(`Published ${EventType.RESERVATION_CREATED}`, {
      reservationId: data.reservationId,
    });
  }

  publishPaymentConfirmed(data: PaymentConfirmedEvent['data']) {
    const event: PaymentConfirmedEvent = {
      id: uuidv4(),
      type: EventType.PAYMENT_CONFIRMED,
      timestamp: new Date(),
      data,
    };

    this.client.emit(EventType.PAYMENT_CONFIRMED, event);
    this.logger.log(`Published ${EventType.PAYMENT_CONFIRMED}`, {
      reservationId: data.reservationId,
    });
  }

  publishReservationExpired(data: ReservationExpiredEvent['data']) {
    const event: ReservationExpiredEvent = {
      id: uuidv4(),
      type: EventType.RESERVATION_EXPIRED,
      timestamp: new Date(),
      data,
    };

    this.client.emit(EventType.RESERVATION_EXPIRED, event);
    this.logger.log(`Published ${EventType.RESERVATION_EXPIRED}`, {
      reservationId: data.reservationId,
    });
  }
}
