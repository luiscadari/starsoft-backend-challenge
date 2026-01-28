export class ReservationResponseDto {
  reservationId: number;
  sessionId: number;
  chairIds: number[];
  userId: number;
  expiresAt: Date;
  expiresInSeconds: number;
}
