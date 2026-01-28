import { Injectable, Logger } from '@nestjs/common';
import { CreateSessionDto } from '../dto/create-session.dto';
import {
  ChairAvailabilityDto,
  SessionAvailabilityDto,
} from '../dto/session-availability.dto';
import { Session } from '../models/session.models';
import { ChairRepository } from '../repositories/chair.repository';
import { ReservationRepository } from '../repositories/reservation.repository';
import { SaleRepository } from '../repositories/sale.repository';
import { SessionRepository } from '../repositories/session.repository';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly chairRepository: ChairRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly saleRepository: SaleRepository,
  ) {}

  async createSession(dto: CreateSessionDto): Promise<Session> {
    this.logger.log(
      `Criando nova sessão: ${dto.movie} no dia ${dto.date.toISOString()} às ${dto.time} na sala ${dto.room}`,
    );
    return this.sessionRepository.create(dto);
  }

  async getSessionAvailability(
    sessionId: number,
  ): Promise<SessionAvailabilityDto> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error(`Sessão ${sessionId} não encontrada`);
    }

    const chairs = await this.chairRepository.findBySessionId(sessionId);
    const sales = await this.saleRepository.findBySessionId(sessionId);
    const activeReservations =
      await this.reservationRepository.findActiveBySessionAndChairs(
        sessionId,
        chairs.map((c) => c.id),
      );

    const soldChairIds = new Set(sales.map((s) => s.chairId));
    const reservedChairIds = new Set(activeReservations.map((r) => r.chairId));

    const chairsAvailability: ChairAvailabilityDto[] = chairs.map((chair) => {
      let status: 'available' | 'reserved' | 'sold';

      if (soldChairIds.has(chair.id)) {
        status = 'sold';
      } else if (reservedChairIds.has(chair.id)) {
        status = 'reserved';
      } else {
        status = 'available';
      }

      return {
        id: chair.id,
        row: chair.row,
        number: chair.number,
        status,
      };
    });

    const availableSeats = chairsAvailability.filter(
      (c) => c.status === 'available',
    ).length;
    const reservedSeats = chairsAvailability.filter(
      (c) => c.status === 'reserved',
    ).length;
    const soldSeats = chairsAvailability.filter(
      (c) => c.status === 'sold',
    ).length;

    return {
      sessionId: session.id,
      movie: session.movie,
      hour: session.hour,
      room: session.room,
      ticketPrice: Number(session.ticketPrice),
      totalSeats: chairs.length,
      availableSeats,
      reservedSeats,
      soldSeats,
      chairs: chairsAvailability,
    };
  }

  async getAllSessions(): Promise<Session[]> {
    return this.sessionRepository.findAll();
  }
}
