import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../models/sales.models';

@Injectable()
export class SaleRepository {
  private readonly logger = new Logger(SaleRepository.name);

  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
  ) {}

  async create(
    sessionId: number,
    chairsIds: number[],
    userId: number,
    value: number,
    reservationId?: number,
  ): Promise<Sale> {
    const sale = this.saleRepository.create({
      sessionId,
      chairsIds,
      userId,
      value,
      reservationId,
    });

    const saved = await this.saleRepository.save(sale);
    this.logger.log(
      `Venda ${saved.id} criada para os assentos ${chairsIds.join(', ')} no valor de R$ ${value}`,
    );

    return saved;
  }

  async findByUserId(userId: number): Promise<Sale[]> {
    return this.saleRepository.find({
      where: { userId },
      relations: ['session', 'chair'],
      order: { createdAt: 'DESC' },
    });
  }

  async findBySessionAndChair(
    sessionId: number,
    chairId: number,
  ): Promise<Sale | null> {
    return this.saleRepository.findOne({
      where: { sessionId, chairsIds: chairId },
    });
  }

  async findBySessionId(sessionId: number): Promise<Sale[]> {
    return this.saleRepository.find({
      where: { sessionId },
      relations: ['chairs'],
    });
  }
}
