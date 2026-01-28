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

@Entity('chairs')
@Index(['sessionId', 'row', 'number'], { unique: true })
export class Chair {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10 })
  row: string;

  @Column({ type: 'int' })
  number: number;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'int' })
  sessionId: number;

  @ManyToOne(() => Session, (session) => session.chairs)
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
