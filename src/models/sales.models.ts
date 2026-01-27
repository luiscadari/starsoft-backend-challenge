import { Column, ForeignKey, PrimaryGeneratedColumn } from "typeorm";
import { Session } from "./session.models";
import { Chair } from "./chairs.models";

export class Sales {
    @PrimaryGeneratedColumn()
    id: number;
    @Column('float')
    value: number;
    @ForeignKey(() => Session)
    @Column('number')
    sessionId: number;
    @ForeignKey(() => Chair)
    @Column('number')
    chairId: number;
    @ForeignKey(() => User)
    @Column('number')
    userId: number;
}