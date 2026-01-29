import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Chair } from '../models/chairs.models';

@Injectable()
export class ChairRepository {
  private readonly logger = new Logger(ChairRepository.name);

  constructor(
    @InjectRepository(Chair)
    private readonly chairRepository: Repository<Chair>,
    private readonly dataSource: DataSource,
  ) {}

  async findByIds(chairIds: number[]): Promise<Chair[]> {
    return this.chairRepository.find({
      where: { id: In(chairIds) },
    });
  }

  async findBySessionId(sessionId: number): Promise<Chair[]> {
    return this.chairRepository.find({
      where: { sessionId },
      order: { row: 'ASC', number: 'ASC' },
    });
  }

  async releaseChairs(chairsId: number[]): Promise<Chair[]> {
    const chairs = await this.chairRepository.find({
      where: { id: In(chairsId) },
    });
    for (const chair of chairs) {
      chair.isAvailable = true;
    }
    return this.chairRepository.save(chairs);
  }

  async lockChairsForUpdate(
    chairIds: number[],
    sessionId: number,
  ): Promise<Chair[]> {
    // Usar SELECT FOR UPDATE para bloquear os assentos durante a transação
    // Isso previne race conditions
    const chairs = await this.dataSource
      .createQueryBuilder()
      .select('chair')
      .from(Chair, 'chair')
      .where('chair.id IN (:...chairIds)', { chairIds })
      .andWhere('chair.sessionId = :sessionId', { sessionId })
      .setLock('pessimistic_write')
      .getMany();

    return chairs;
  }

  async updateAvailability(
    chairId: number,
    isAvailable: boolean,
  ): Promise<void> {
    await this.chairRepository.update({ id: chairId }, { isAvailable });
    this.logger.log(
      `Assento ${chairId} atualizado para disponível: ${isAvailable}`,
    );
  }
}
