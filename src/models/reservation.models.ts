import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ManyToMany } from 'typeorm/browser';
import { Chair } from './chairs.models';
import { Session } from './session.models';
import { User } from './user.models';

@Entity('reservations')
@Index(['sessionId', 'chairId'], { unique: true, where: "status = 'active'" })
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  sessionId: number;

  @Column({ type: 'array' })
  chairsIds: number[];

  @Column({ type: 'int' })
  userId: number;

  @Column({
    type: 'timestamp',
    default: () => new Date(new Date().getTime() + 30 * 1000),
  })
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

  @ManyToMany(() => Chair)
  @JoinColumn({ name: 'chairsId' })
  chairs: Chair[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
