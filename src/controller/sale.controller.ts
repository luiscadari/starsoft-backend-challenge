import { Controller, Get, Param, ParseIntPipe, Logger } from '@nestjs/common';
import { SaleService } from '../services/sale.service';
import { PurchaseHistoryDto } from '../dto/purchase-history.dto';

@Controller('sales')
export class SaleController {
  private readonly logger = new Logger(SaleController.name);

  constructor(private readonly saleService: SaleService) {}

  /**
   * Histórico de compras por usuário
   * GET /sales/user/:userId
   */
  @Get('user/:userId')
  async getUserPurchaseHistory(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<PurchaseHistoryDto[]> {
    this.logger.log(
      `Requisição para buscar histórico de compras do usuário ${userId}`,
    );
    return this.saleService.getUserPurchaseHistory(userId);
  }
}
