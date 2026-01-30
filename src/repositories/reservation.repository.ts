import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { Reservation } from '../models/reservation.models';

@Injectable()
export class ReservationRepository {
  private readonly logger = new Logger(ReservationRepository.name);
  private static readonly RESERVATION_EXPIRATION_SECONDS = 30;

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    sessionId: number,
    chairsIds: number[],
    userId: number,
  ): Promise<Reservation> {
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() +
        ReservationRepository.RESERVATION_EXPIRATION_SECONDS,
    );

    const reservation = this.reservationRepository.create({
      sessionId,
      chairsIds,
      userId,
      expiresAt,
      status: 'active',
    });

    const saved = await this.reservationRepository.save(reservation);
    this.logger.log(
      `Reserva ${saved.id} criada para os assentos ${chairsIds.join(', ')}, expira em ${expiresAt.toISOString()}`,
    );

    return saved;
  }

  async findById(id: number): Promise<Reservation | null> {
    return this.reservationRepository.findOne({
      where: { id },
      relations: ['session', 'chair', 'user'],
    });
  }

  async findActiveBySessionAndChair(
    sessionId: number,
    chairId: number,
  ): Promise<Reservation | null> {
    return this.reservationRepository.findOne({
      where: {
        sessionId,
        chairsIds: chairId,
        status: 'active',
      },
    });
  }

  async findActiveBySessionAndChairs(
    sessionId: number,
    chairIds: number[],
  ): Promise<Reservation[]> {
    return this.dataSource
      .createQueryBuilder()
      .select('reservation')
      .from(Reservation, 'reservation')
      .where('reservation.sessionId = :sessionId', { sessionId })
      .andWhere('reservation.chairId IN (:...chairIds)', { chairIds })
      .andWhere('reservation.status = :status', { status: 'active' })
      .getMany();
  }

  async confirmReservation(reservationId: number): Promise<void> {
    await this.reservationRepository.update(
      { id: reservationId },
      { status: 'confirmed' },
    );
    this.logger.log(`Reserva ${reservationId} confirmada`);
  }

  async expireReservation(reservationId: number): Promise<void> {
    await this.reservationRepository.update(
      { id: reservationId },
      { status: 'expired' },
    );
    this.logger.log(`Reserva ${reservationId} expirada`);
  }

  async findExpiredReservations(): Promise<Reservation[]> {
    return this.reservationRepository.find({
      where: {
        status: 'active',
        expiresAt: LessThan(new Date()),
      },
      relations: ['chair'],
    });
  }

  async bulkExpireReservations(reservationIds: number[]): Promise<void> {
    if (reservationIds.length === 0) return;

    await this.dataSource
      .createQueryBuilder()
      .update(Reservation)
      .set({ status: 'expired' })
      .where('id IN (:...ids)', { ids: reservationIds })
      .execute();

    this.logger.log(`${reservationIds.length} reservas expiradas em batch`);
  }
}
