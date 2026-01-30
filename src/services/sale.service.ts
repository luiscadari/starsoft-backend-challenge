import { Injectable, Logger } from '@nestjs/common';
import { PurchaseHistoryDto } from '../dto/purchase-history.dto';
import { SaleRepository } from '../repositories/sale.repository';

@Injectable()
export class SaleService {
  private readonly logger = new Logger(SaleService.name);

  constructor(private readonly saleRepository: SaleRepository) {}

  async getUserPurchaseHistory(userId: number): Promise<PurchaseHistoryDto[]> {
    const sales = await this.saleRepository.findByUserId(userId);

    return sales.map((sale) => ({
      saleId: sale.id,
      sessionId: sale.sessionId,
      movie: sale.session.movie,
      hour: sale.session.hour,
      room: sale.session.room,
      chairs: sale.chairs.map((chair) => ({
        row: chair.row,
        number: chair.number,
      })),
      value: Number(sale.value),
      purchasedAt: sale.createdAt,
    }));
  }
}
