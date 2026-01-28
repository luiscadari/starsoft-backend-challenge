import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

// Models
import { Session } from './models/session.models';
import { Chair } from './models/chairs.models';
import { Reservation } from './models/reservation.models';
import { Sale } from './models/sales.models';
import { User } from './models/user.models';

// Repositories
import { SessionRepository } from './repositories/session.repository';
import { ChairRepository } from './repositories/chair.repository';
import { ReservationRepository } from './repositories/reservation.repository';
import { SaleRepository } from './repositories/sale.repository';
import { UserRepository } from './repositories/user.repository';

// Services
import { SessionService } from './services/session.service';
import { ReservationService } from './services/reservation.service';
import { SaleService } from './services/sale.service';
import { EventEmitterService } from './services/event-emitter.service';
import { ReservationExpirationJob } from './services/reservation-expiration.job';

// Controllers
import { SessionController } from './controller/session.controller';
import { ReservationController } from './controller/reservation.controller';
import { SaleController } from './controller/sale.controller';
import { UserController } from './controller/user.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'cinema',
      entities: [Session, Chair, Reservation, Sale, User],
      synchronize: process.env.NODE_ENV !== 'production', // Apenas em desenvolvimento
      logging: process.env.DB_LOGGING === 'true',
    }),
    TypeOrmModule.forFeature([Session, Chair, Reservation, Sale, User]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    SessionController,
    ReservationController,
    SaleController,
    UserController,
  ],
  providers: [
    // Repositories
    SessionRepository,
    ChairRepository,
    ReservationRepository,
    SaleRepository,
    UserRepository,
    // Services
    SessionService,
    ReservationService,
    SaleService,
    EventEmitterService,
    // Jobs
    ReservationExpirationJob,
  ],
})
export class AppModule {}
