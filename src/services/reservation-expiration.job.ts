import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReservationService } from './reservation.service';

@Injectable()
export class ReservationExpirationJob {
  private readonly logger = new Logger(ReservationExpirationJob.name);

  constructor(private readonly reservationService: ReservationService) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleReservationExpiration(): Promise<void> {
    try {
      const expiredCount = await this.reservationService.expireReservations();

      if (expiredCount > 0) {
        this.logger.log(`Job executado: ${expiredCount} reservas expiradas`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(
        `Erro ao executar job de expiração de reservas: ${errorMessage}`,
        errorStack,
      );
    }
  }
}
