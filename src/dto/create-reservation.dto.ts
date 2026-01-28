import { IsNumber, IsArray, ArrayMinSize } from 'class-validator';

export class CreateReservationDto {
  @IsNumber()
  sessionId: number;

  @IsNumber()
  userId: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'Deve haver pelo menos um assento na reserva' })
  @IsNumber({}, { each: true })
  chairIds: number[];
}
