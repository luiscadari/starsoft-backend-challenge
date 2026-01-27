import { Column, Entity, ForeignKey, PrimaryGeneratedColumn } from 'typeorm';
import { Session } from './session.models';
import { Chair } from './chairs.models';
import { User } from './user.models';

@Entity()
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;
  @ForeignKey(() => Session)
  @Column('number')
  sessionId: number;
  @ForeignKey(() => Chair)
  @Column('number')
  chairId: number;
  @ForeignKey(() => User)
  @Column('number')
  userId: number;
  @Column('date')
  expiresAt: Date;
  @Column('boolean')
  paymentStatus: boolean;
}
