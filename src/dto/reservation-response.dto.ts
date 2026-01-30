export class ReservationResponseDto {
  reservationId: number;
  sessionId: number;
  chairsIds: number[];
  userId: number;
  expiresAt: Date;
  expiresInSeconds: number;
}
