import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateChairDto {
  @IsString()
  row: string;

  @IsNumber()
  @Min(1)
  number: number;
  @IsNumber()
  sessionId: number;
}

export class CreateSessionDto {
  @IsString()
  movie: string;

  @IsString()
  time: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  room: string;

  @IsNumber()
  @Min(0)
  ticketPrice: number;

  @IsNumber()
  @Min(10)
  @Max(50)
  chairs: number;
  // @IsArray()
  // @ValidateNested({ each: true })
  // @ArrayMinSize(16, { message: 'A sessão deve ter no mínimo 16 assentos' })
  // @Type(() => CreateChairDto)
  // chairs: CreateChairDto[];
}
