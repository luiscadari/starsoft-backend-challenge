import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateReservationDto, UserDto } from '../dto/create-reservation.dto';
import { ReservationResponseDto } from '../dto/reservation-response.dto';
import { MessagingService } from '../messaging/messaging.service';
import { Reservation } from '../models/reservation.models';
import { Sale } from '../models/sales.models';
import { User } from '../models/user.models';
import { RedisService } from '../redis/redis.service';
import { ChairRepository } from '../repositories/chair.repository';
import { ReservationRepository } from '../repositories/reservation.repository';
import { SaleRepository } from '../repositories/sale.repository';
import { SessionRepository } from '../repositories/session.repository';
import { UserRepository } from '../repositories/user.repository';
import { EventEmitterService } from './event-emitter.service';

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);
  private static readonly RESERVATION_EXPIRATION_SECONDS = 30;

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly chairRepository: ChairRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly saleRepository: SaleRepository,
    private readonly redisService: RedisService,
    private readonly messagingService: MessagingService,
    private readonly userRepository: UserRepository,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitterService,
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
  ) {}

  async createReservation(
    dto: CreateReservationDto,
  ): Promise<ReservationResponseDto> {
    // Validar que a sessão existe
    const sessionExists = await this.sessionRepository.exists(dto.sessionId);
    if (!sessionExists) {
      throw new NotFoundException(`Sessão ${dto.sessionId} não encontrada`);
    }
    // Validar que o usuário existe
    let user: UserDto | User | null = null;
    if (dto.userId) {
      const userExists = await this.userRepository.exists(dto.userId);
      if (!userExists) {
        throw new NotFoundException(`Usuário ${dto.userId} não encontrado`);
      }
      user = userExists;
    } else if (!dto.userId) {
      if (!dto.user)
        throw new BadRequestException('Dados do usuário são obrigatórios');
      user = dto.user;
      user = await this.userRepository.create(user.name, user.cpf);
      dto.userId = (user as User).id;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE'); // Nível de isolamento máximo

    try {
      // Bloquear os assentos para update (SELECT FOR UPDATE)
      // Isso previne race conditions
      const chairs = await this.chairRepository.lockChairsForUpdate(
        dto.chairsIds,
        dto.sessionId,
      );

      // Validar que todos os assentos foram encontrados
      if (chairs.length !== dto.chairsIds.length) {
        const foundIds = chairs.map((c) => c.id);
        const notFound = dto.chairsIds.filter((id) => !foundIds.includes(id));
        throw new NotFoundException(
          `Assentos não encontrados nesta sessão: ${notFound.join(', ')}`,
        );
      }
      // Verificar se algum assento já está vendido
      const soldChairs = chairs
        .map((chair) => {
          if (!chair.isAvailable) {
            return chair.id;
          }
        })
        .filter((id) => id !== undefined);

      if (soldChairs.length > 0) {
        throw new ConflictException(
          `Assentos indisponíveis: ${soldChairs.join(', ')}`,
        );
      }

      // Criar as reservas
      const reservation = await this.reservationRepository.create(
        dto.sessionId,
        dto.chairsIds,
        dto.userId,
      );
      // Marcar os assentos como indisponíveis
      for (const chair of chairs) {
        chair.isAvailable = false;
        await queryRunner.manager.save(chair);
      }
      await queryRunner.commitTransaction();
      // TODO: Criar fila assincrona para expirar reservas após 30 segundos
      const firstReservation = reservation;
      const expiresAt = new Date(firstReservation.expiresAt);
      const expiresInSeconds = Math.floor(
        (expiresAt.getTime() - Date.now()) / 1000,
      );

      this.logger.log(`reservas criadas para a sessão ${dto.sessionId}`);

      // Emitir evento de reserva criada
      this.messagingService.publishReservationCreated({
        reservationId: reservation.id,
        sessionId: reservation.sessionId,
        seatNumbers: reservation.chairsIds,
        userId: reservation.userId,
        expiresAt,
      });
      // Não será mais necessário, pois agora, o rabbitmq cuidará disso
      // this.eventEmitter.emitReservationCreated({
      //   reservationIds: reservations.map((r) => r.id),
      //   sessionId: dto.sessionId,
      //   chairsIds: dto.chairsIds,
      //   userId: dto.userId,
      //   expiresAt,
      // });
      // Caching da reserva temporária no Redis
      await this.redisService.storeTemporaryReservation(reservation.id, {
        ...reservation,
      });
      return {
        reservationId: firstReservation.id,
        sessionId: dto.sessionId,
        chairsIds: dto.chairsIds,
        userId: dto.userId,
        expiresAt,
        expiresInSeconds,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(`Erro ao criar reserva: ${errorMessage}`, errorStack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async confirmPayment(
    reservationId: number,
    userId: number,
  ): Promise<{ success: boolean; saleIds: number[] }> {
    let reservation =
      await this.redisService.getTemporaryReservation(reservationId);
    if (!reservation) {
      reservation = await this.reservationRepository.findById(reservationId);
    }

    if (!reservation) {
      throw new NotFoundException(`Reserva ${reservationId} não encontrada`);
    }

    if (reservation.userId !== userId) {
      throw new BadRequestException(
        'Você não tem permissão para confirmar esta reserva',
      );
    }

    if (reservation.status !== 'active') {
      throw new BadRequestException(
        `Esta reserva não está ativa. Status atual: ${reservation.status}`,
      );
    }

    // Verificar se a reserva já expirou
    if (new Date() > reservation.expiresAt) {
      await this.reservationRepository.expireReservation(reservationId);
      throw new BadRequestException(
        'Esta reserva já expirou e não pode ser confirmada',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Buscar todas as reservas do mesmo grupo (mesmo ID principal ou mesma sessão/usuário)
      const allReservations = await queryRunner.manager.find(Reservation, {
        where: {
          sessionId: reservation.sessionId,
          userId: reservation.userId,
          status: 'active' as const,
        },
      });

      const session = await this.sessionRepository.findById(
        reservation.sessionId,
      );

      if (!session) {
        throw new NotFoundException(
          `Sessão ${reservation.sessionId} não encontrada`,
        );
      }

      // Criar vendas para todas as reservas
      const sale = await this.saleRepository.create(
        reservation.sessionId,
        reservation.chairsIds,
        reservation.userId,
        session.ticketPrice,
        reservation.id,
      );

      // Confirmar todas as reservas
      await queryRunner.manager.update(
        Reservation,
        allReservations.map((r) => r.id),
        { status: 'confirmed' as const },
      );

      await queryRunner.commitTransaction();

      this.logger.log(
        `Pagamento confirmado para ${reservation.sessionId} assentos. Vendas: ${reservation.chairsIds.join(', ')}`,
      );

      // Emitir evento de pagamento confirmado
      this.messagingService.publishPaymentConfirmed({
        reservationId: reservation.id,
        paymentId: sale.id,
        amount: sale.value,
        confirmedAt: new Date(),
      });

      return {
        success: true,
        saleIds: [sale.id],
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(
        `Erro ao confirmar pagamento: ${errorMessage}`,
        errorStack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async expireReservations(): Promise<number> {
    const expiredReservations =
      await this.reservationRepository.findExpiredReservations();

    if (expiredReservations.length === 0) {
      return 0;
    }

    const reservationIds = expiredReservations.map((r) => r.id);
    await this.reservationRepository.bulkExpireReservations(reservationIds);

    this.logger.log(`${expiredReservations.length} reservas expiradas`);

    // Emitir eventos de reservas expiradas
    expiredReservations.forEach((reservation) => {
      this.messagingService.publishReservationExpired({
        reservationId: reservation.id,
        sessionId: reservation.sessionId,
        chairsIds: reservation.chairsIds,
      });
    });

    return expiredReservations.length;
  }
}
