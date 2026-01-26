import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { Chair } from './chairs.models';

@Entity()
export class Session {
  @PrimaryGeneratedColumn()
  id: number;
  @Column('string')
  movie: string;
  @Column('date')
  hour: Date;
  @Column('string')
  room: string;
  @Column('json')
  chairs: Chair[];
}
