import { Injectable, Logger } from '@nestjs/common';
import { SaleRepository } from '../repositories/sale.repository';
import { PurchaseHistoryDto } from '../dto/purchase-history.dto';

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
      chairRow: sale.chair.row,
      chairNumber: sale.chair.number,
      value: Number(sale.value),
      purchasedAt: sale.createdAt,
    }));
  }
}
