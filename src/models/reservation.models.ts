import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Session } from './session.models';
import { Chair } from './chairs.models';
import { User } from './user.models';

@Entity('reservations')
@Index(['sessionId', 'chairId'], { unique: true, where: "status = 'active'" })
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  sessionId: number;

  @Column({ type: 'int' })
  chairId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({
    type: 'enum',
    enum: ['active', 'confirmed', 'expired', 'cancelled'],
    default: 'active',
  })
  status: 'active' | 'confirmed' | 'expired' | 'cancelled';

  @ManyToOne(() => Session)
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @ManyToOne(() => Chair)
  @JoinColumn({ name: 'chairId' })
  chair: Chair;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
