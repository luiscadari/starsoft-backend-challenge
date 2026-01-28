export class PurchaseHistoryDto {
  saleId: number;
  sessionId: number;
  movie: string;
  hour: Date;
  room: string;
  chairRow: string;
  chairNumber: number;
  value: number;
  purchasedAt: Date;
}
