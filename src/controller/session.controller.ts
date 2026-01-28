import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { CreateSessionDto } from '../dto/create-session.dto';
import { SessionAvailabilityDto } from '../dto/session-availability.dto';
import { Session } from '../models/session.models';

@Controller('sessions')
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(private readonly sessionService: SessionService) {}

  /**
   * Criar uma nova sessão de cinema
   * POST /sessions
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @Body() createSessionDto: CreateSessionDto,
  ): Promise<Session> {
    this.logger.log(`Requisição para criar sessão: ${createSessionDto.movie}`);
    return this.sessionService.createSession(createSessionDto);
  }

  /**
   * Listar todas as sessões
   * GET /sessions
   */
  @Get()
  async getAllSessions(): Promise<Session[]> {
    this.logger.log('Requisição para listar todas as sessões');
    return this.sessionService.getAllSessions();
  }

  /**
   * Buscar disponibilidade de assentos por sessão em tempo real
   * GET /sessions/:id/availability
   */
  @Get(':id/availability')
  async getSessionAvailability(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SessionAvailabilityDto> {
    this.logger.log(
      `Requisição para verificar disponibilidade da sessão ${id}`,
    );
    return this.sessionService.getSessionAvailability(id);
  }
}
