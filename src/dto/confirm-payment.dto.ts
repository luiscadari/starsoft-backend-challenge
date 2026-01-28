import { IsNumber } from 'class-validator';

export class ConfirmPaymentDto {
  @IsNumber()
  reservationId: number;

  @IsNumber()
  userId: number;
}
