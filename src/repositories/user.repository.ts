import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../models/user.models';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByCpf(cpf: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { cpf } });
  }

  async create(name: string, cpf: string): Promise<User> {
    const user = this.userRepository.create({ name, cpf });
    const saved = await this.userRepository.save(user);
    this.logger.log(`Usuário ${saved.id} criado: ${name}`);
    return saved;
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.userRepository.count({ where: { id } });
    return count > 0;
  }
}
