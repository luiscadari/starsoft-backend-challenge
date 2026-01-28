import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../models/user.models';

class CreateUserDto {
  name: string;
  cpf: string;
}

@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Criar um novo usuário
   * POST /users
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Requisição para criar usuário: ${createUserDto.name}`);
    return this.userRepository.create(createUserDto.name, createUserDto.cpf);
  }

  /**
   * Buscar usuário por ID
   * GET /users/:id
   */
  @Get(':id')
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<User | null> {
    this.logger.log(`Requisição para buscar usuário ${id}`);
    return this.userRepository.findById(id);
  }
}
