import { Column, Entity, ForeignKey, PrimaryGeneratedColumn } from 'typeorm';
import { Session } from './session.models';

@Entity()
export class Chair {
  @PrimaryGeneratedColumn()
  id: number;
  @Column('string')
  row: string;
  @Column('number')
  number: number;
  @Column('boolean')
  isAvailable: boolean;
  @ForeignKey(() => Session)
  @Column('number')
  sessionId: number;
}
