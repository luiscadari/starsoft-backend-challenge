import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Session } from './session.models';
import { Chair } from './chairs.models';
import { User } from './user.models';

@Entity('sales')
@Index(['sessionId', 'chairId'], { unique: true })
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ type: 'int' })
  sessionId: number;

  @Column({ type: 'int' })
  chairId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int', nullable: true })
  reservationId: number;

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
}
