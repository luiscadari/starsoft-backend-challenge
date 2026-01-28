import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateChairDto, CreateSessionDto } from '../dto/create-session.dto';
import { Chair } from '../models/chairs.models';
import { Session } from '../models/session.models';
import Rows from '../types/rows.enum';

@Injectable()
export class SessionRepository {
  private readonly logger = new Logger(SessionRepository.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Chair)
    private readonly chairRepository: Repository<Chair>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createSessionDto: CreateSessionDto): Promise<Session> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Criar a sessão
      createSessionDto.date.setHours(
        Number(createSessionDto.time.split(':')[0]),
      );
      createSessionDto.date.setMinutes(
        Number(createSessionDto.time.split(':')[1]),
      );
      const session = this.sessionRepository.create({
        movie: createSessionDto.movie,
        hour: createSessionDto.date,
        room: createSessionDto.room,
        ticketPrice: createSessionDto.ticketPrice,
      });

      const savedSession = await queryRunner.manager.save(Session, session);
      this.logger.log(`Sessão criada com ID ${savedSession.id}`);

      // Criar os assentos
      const rows: Record<Rows, CreateChairDto[]> = {
        A: [] as CreateChairDto[],
        B: [] as CreateChairDto[],
        C: [] as CreateChairDto[],
        D: [] as CreateChairDto[],
        E: [] as CreateChairDto[],
      };

      for (let i = 0; i < createSessionDto.chairs; i++) {
        if (i < 10)
          rows['A'].push({
            row: 'A',
            number: i + 1,
            sessionId: savedSession.id,
          });
        else if (i < 20)
          rows['B'].push({
            row: 'B',
            number: i - 9,
            sessionId: savedSession.id,
          });
        else if (i < 30)
          rows['C'].push({
            row: 'C',
            number: i - 19,
            sessionId: savedSession.id,
          });
        else
          rows['D'].push({
            row: 'D',
            number: i - 29,
            sessionId: savedSession.id,
          });
      }
      const chairs = [
        ...Object.keys(rows)
          .map((key) => rows[key as keyof typeof rows])
          .flat(),
      ];

      await queryRunner.manager.save(Chair, chairs);
      this.logger.log(
        `${chairs.length} assentos criados para a sessão ${savedSession.id}`,
      );

      await queryRunner.commitTransaction();

      const sessionWithChairs = await this.findById(savedSession.id);
      if (!sessionWithChairs) {
        throw new Error('Erro ao recuperar sessão criada');
      }
      return sessionWithChairs;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(`Erro ao criar sessão: ${errorMessage}`, errorStack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findById(id: number): Promise<Session | null> {
    return this.sessionRepository.findOne({
      where: { id },
      relations: ['chairs'],
    });
  }

  async findAll(): Promise<Session[]> {
    return this.sessionRepository.find({
      relations: ['chairs'],
      order: { hour: 'ASC' },
    });
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.sessionRepository.count({ where: { id } });
    return count > 0;
  }
}
