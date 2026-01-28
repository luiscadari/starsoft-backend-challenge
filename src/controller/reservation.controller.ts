import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ReservationService } from '../services/reservation.service';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { ConfirmPaymentDto } from '../dto/confirm-payment.dto';
import { ReservationResponseDto } from '../dto/reservation-response.dto';

@Controller('reservations')
export class ReservationController {
  private readonly logger = new Logger(ReservationController.name);

  constructor(private readonly reservationService: ReservationService) {}

  /**
   * Reservar assento(s)
   * POST /reservations
   *
   * A reserva tem validade de 30 segundos
   * Retorna ID da reserva e timestamp de expiração
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createReservation(
    @Body() createReservationDto: CreateReservationDto,
  ): Promise<ReservationResponseDto> {
    this.logger.log(
      `Requisição para reservar assentos ${createReservationDto.chairIds.join(', ')} na sessão ${createReservationDto.sessionId}`,
    );
    return this.reservationService.createReservation(createReservationDto);
  }

  /**
   * Confirmar pagamento de uma reserva
   * POST /reservations/confirm-payment
   *
   * Converte reserva em venda definitiva
   * Publica evento de venda confirmada
   */
  @Post('confirm-payment')
  @HttpCode(HttpStatus.OK)
  async confirmPayment(
    @Body() confirmPaymentDto: ConfirmPaymentDto,
  ): Promise<{ success: boolean; saleIds: number[] }> {
    this.logger.log(
      `Requisição para confirmar pagamento da reserva ${confirmPaymentDto.reservationId}`,
    );
    return this.reservationService.confirmPayment(
      confirmPaymentDto.reservationId,
      confirmPaymentDto.userId,
    );
  }
}
