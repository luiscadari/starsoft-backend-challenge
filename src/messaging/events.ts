// src/messaging/events.ts
export enum EventType {
  RESERVATION_CREATED = 'reservation.created',
  RESERVATION_EXPIRED = 'reservation.expired',
  PAYMENT_CONFIRMED = 'payment.confirmed',
  PAYMENT_FAILED = 'payment.failed',
  SEAT_RELEASED = 'seat.released',
  SEAT_RESERVED = 'seat.reserved',
}

export interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  correlationId?: string;
}

export interface ReservationCreatedEvent extends BaseEvent {
  type: EventType.RESERVATION_CREATED;
  data: {
    reservationId: number;
    sessionId: number;
    seatNumbers: number[];
    userId: number;
    expiresAt: Date;
  };
}

export interface PaymentConfirmedEvent extends BaseEvent {
  type: EventType.PAYMENT_CONFIRMED;
  data: {
    reservationId: number;
    paymentId: number;
    amount: number;
    confirmedAt: Date;
  };
}

export interface ReservationExpiredEvent extends BaseEvent {
  type: EventType.RESERVATION_EXPIRED;
  data: {
    reservationId: number;
    sessionId: number;
    chairsId: number[];
  };
}
