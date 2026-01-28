export class SessionAvailabilityDto {
  sessionId: number;
  movie: string;
  hour: Date;
  room: string;
  ticketPrice: number;
  totalSeats: number;
  availableSeats: number;
  reservedSeats: number;
  soldSeats: number;
  chairs: ChairAvailabilityDto[];
}

export class ChairAvailabilityDto {
  id: number;
  row: string;
  number: number;
  status: 'available' | 'reserved' | 'sold';
}
