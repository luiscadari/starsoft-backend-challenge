import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Chair } from './chairs.models';
import { Session } from './session.models';
import { User } from './user.models';

@Entity('sales')
@Index(['sessionId', 'chairsIds'], { unique: true })
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ type: 'int' })
  sessionId: number;

  @Column({ type: 'int', array: true })
  chairsIds: number[];

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int', nullable: true })
  reservationId: number;

  @ManyToOne(() => Session)
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @ManyToOne(() => Chair)
  @JoinColumn({ name: 'chairsIds' })
  chairs: Chair[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
