// src/redis/redis.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly LOCK_TIMEOUT = 10000; // 10 segundos
  private readonly RETRY_DELAY = 100; // 100ms entre tentativas
  private readonly MAX_RETRIES = 50; // Máximo de tentativas para lock

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  // ============ LOCK DISTRIBUÍDO (Race Condition) ============

  /**
   * Implementação de Distributed Lock usando SETNX
   * Resolve race conditions em múltiplas instâncias
   */
  async acquireLock(
    key: string,
    timeoutMs: number = this.LOCK_TIMEOUT,
  ): Promise<string | null> {
    const lockId = uuidv4();
    const lockKey = `lock:${key}`;

    // SET key value NX PX timeout - Operação atômica
    const result = await this.redis.set(lockKey, lockId, 'PX', timeoutMs, 'NX');

    if (result === 'OK') {
      this.logger.debug(`Lock acquired: ${lockKey}`, { lockId });
      return lockId;
    }

    return null;
  }

  /**
   * Tenta adquirir lock com retry
   */
  async acquireLockWithRetry(
    key: string,
    maxRetries: number = this.MAX_RETRIES,
  ): Promise<string> {
    for (let i = 0; i < maxRetries; i++) {
      const lockId = await this.acquireLock(key);
      if (lockId) {
        return lockId;
      }

      if (i < maxRetries - 1) {
        await this.sleep(this.RETRY_DELAY);
      }
    }

    throw new Error(
      `Could not acquire lock for key: ${key} after ${maxRetries} retries`,
    );
  }

  /**
   * Libera lock verificando se é o dono (evita liberar lock de outro processo)
   */
  async releaseLock(key: string, lockId: string): Promise<boolean> {
    const lockKey = `lock:${key}`;

    // Usar Lua script para operação atômica
    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.redis.eval(script, 1, lockKey, lockId);

    if (result === 1) {
      this.logger.debug(`Lock released: ${lockKey}`, { lockId });
      return true;
    }

    this.logger.warn(
      `Failed to release lock: ${lockKey} - Lock mismatch or expired`,
    );
    return false;
  }

  // ============ CACHE DE DISPONIBILIDADE ============

  /**
   * Cache da disponibilidade de assentos por sessão
   * Estrutura: session:{sessionId}:seats -> Hash de assentos
   */
  async cacheSeatAvailability(
    sessionId: string,
    seats: Map<string, any>,
  ): Promise<void> {
    const key = `session:${sessionId}:seats`;

    // Converter Map para objeto
    const seatObject = {};
    seats.forEach((value, seatNumber) => {
      seatObject[seatNumber] = JSON.stringify(value);
    });

    await this.redis.hmset(key, seatObject);
    await this.redis.expire(key, 3600); // Expira em 1 hora
  }

  async getCachedSeat(sessionId: string, seatNumber: string): Promise<any> {
    const key = `session:${sessionId}:seats`;
    const data = await this.redis.hget(key, seatNumber);

    return data ? JSON.parse(data) : null;
  }

  async updateSeatStatus(
    sessionId: string,
    seatNumber: string,
    status: string,
    reservationId?: string,
  ): Promise<void> {
    const key = `session:${sessionId}:seats`;
    const seatData = {
      status,
      reservationId: reservationId || null,
      updatedAt: new Date().toISOString(),
    };

    await this.redis.hset(key, seatNumber, JSON.stringify(seatData));
  }

  // ============ RESERVAS TEMPORÁRIAS ============

  /**
   * Armazena reserva temporária com TTL
   */
  async storeTemporaryReservation(
    reservationId: string,
    data: any,
    ttlSeconds: number = 30,
  ): Promise<void> {
    const key = `reservation:temp:${reservationId}`;
    await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
  }

  async getTemporaryReservation(reservationId: string): Promise<any> {
    const key = `reservation:temp:${reservationId}`;
    const data = await this.redis.get(key);

    return data ? JSON.parse(data) : null;
  }

  // ============ RATE LIMITING ============

  /**
   * Rate limiting por usuário/IP
   * Usa algoritmo sliding window
   */
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ allowed: boolean; remaining: number; reset: number }> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const redisKey = `ratelimit:${key}`;

    // Usar multi para operações atômicas
    const multi = this.redis.multi();

    // Remover requisições antigas
    multi.zremrangebyscore(redisKey, 0, now - windowMs);

    // Contar requisições na janela
    multi.zcard(redisKey);

    // Adicionar requisição atual
    multi.zadd(redisKey, now.toString(), now.toString());

    // Definir TTL
    multi.expire(redisKey, windowSeconds);

    const results = await multi.exec();
    if (!results) {
      throw new Error('Failed to execute rate limit commands');
    }
    const requestCount = results[1][1] as number;

    return {
      allowed: requestCount <= limit,
      remaining: Math.max(0, limit - requestCount),
      reset: now + windowMs,
    };
  }

  // ============ CONTADOR DE TENTATIVAS ============

  /**
   * Contador para idempotência e prevenção de abuso
   */
  async incrementAttempt(
    key: string,
    ttlSeconds: number = 300,
  ): Promise<number> {
    const newValue = await this.redis.incr(key);

    // Se for a primeira vez, setar TTL
    if (newValue === 1) {
      await this.redis.expire(key, ttlSeconds);
    }

    return newValue;
  }

  async resetAttempts(key: string): Promise<void> {
    await this.redis.del(key);
  }

  // ============ PUB/SUB PARA NOTIFICAÇÕES ============

  async publish(channel: string, message: any): Promise<number> {
    return this.redis.publish(channel, JSON.stringify(message));
  }

  // ============ HELPERS ============

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      return false;
    }
  }

  async flushCache(pattern: string = '*'): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
