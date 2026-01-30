import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateReservationDto {
  @IsNumber()
  sessionId: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'Deve haver pelo menos um assento na reserva' })
  @IsNumber({}, { each: true })
  chairsIds: number[];

  @IsNumber()
  @IsOptional()
  userId?: number;
  @IsOptional()
  user?: UserDto;
}

export class ReservationCachingDto extends CreateReservationDto {
  id: number;
  expiresAt: Date;
}

export class UserDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(14)
  cpf: string;
}
