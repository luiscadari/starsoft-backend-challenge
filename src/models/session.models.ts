import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Chair } from './chairs.models';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  movie: string;

  @Column({ type: 'timestamp' })
  hour: Date;

  @Column({ type: 'varchar', length: 100 })
  room: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  ticketPrice: number;

  @OneToMany(() => Chair, (chair) => chair.session)
  chairs: Chair[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
