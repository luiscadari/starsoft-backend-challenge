export class PurchaseHistoryDto {
  saleId: number;
  sessionId: number;
  movie: string;
  hour: Date;
  room: string;
  chairs: { row: string; number: number }[];
  value: number;
  purchasedAt: Date;
}
