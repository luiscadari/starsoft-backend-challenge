# Documentação Técnica - Sistema de Vendas de Ingressos

## Visão Geral da Solução

Este sistema foi desenvolvido para gerenciar a venda de ingressos de cinema com alta concorrência, garantindo que nenhum assento seja vendido duas vezes mesmo com múltiplas instâncias da aplicação rodando simultaneamente.

## Arquitetura

### Camadas da Aplicação

```
┌─────────────────────────────────────┐
│         Controllers                 │  ← Recebe requisições HTTP
├─────────────────────────────────────┤
│          Services                   │  ← Lógica de negócio
├─────────────────────────────────────┤
│        Repositories                 │  ← Acesso aos dados
├─────────────────────────────────────┤
│      TypeORM / Database             │  ← Persistência
└─────────────────────────────────────┘
```

### Princípios SOLID Aplicados

1. **Single Responsibility Principle (SRP)**
   - Cada classe tem uma responsabilidade única
   - Controllers: receber e validar requisições
   - Services: implementar regras de negócio
   - Repositories: acesso aos dados

2. **Open/Closed Principle (OCP)**
   - Sistema aberto para extensão (novos serviços, eventos)
   - Fechado para modificação (contratos bem definidos)

3. **Liskov Substitution Principle (LSP)**
   - Interfaces consistentes entre camadas

4. **Interface Segregation Principle (ISP)**
   - DTOs específicos para cada operação
   - Repositories especializados

5. **Dependency Inversion Principle (DIP)**
   - Dependências injetadas via construtor
   - Uso de abstrações (repositories, services)

## Estratégias de Controle de Concorrência

### 1. Pessimistic Locking (SELECT FOR UPDATE)

**Implementação:**

```typescript
// ChairRepository.lockChairsForUpdate()
const chairs = await this.dataSource
  .createQueryBuilder()
  .select('chair')
  .from(Chair, 'chair')
  .where('chair.id IN (:...chairIds)', { chairIds })
  .setLock('pessimistic_write')
  .getMany();
```

**Como funciona:**

- Ao iniciar uma reserva, os assentos são bloqueados no banco de dados
- Outras transações que tentam acessar os mesmos assentos ficam aguardando
- Previne que dois usuários reservem o mesmo assento simultaneamente

**Vantagens:**

- Garantia absoluta de consistência
- Simples de implementar
- Funciona mesmo com múltiplas instâncias da aplicação

**Desvantagens:**

- Pode causar contenção em cenários de altíssima concorrência
- Requer suporte do banco de dados

### 2. Transações com Nível de Isolamento SERIALIZABLE

**Implementação:**

```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.startTransaction('SERIALIZABLE');
```

**Como funciona:**

- Maior nível de isolamento de transações
- Garante que transações concorrentes sejam executadas como se fossem sequenciais
- Previne anomalias de concorrência (phantom reads, dirty reads, etc.)

**Quando é usado:**

- Na criação de reservas
- Na confirmação de pagamentos

### 3. Índices Únicos Compostos

**Implementação:**

```typescript
@Index(['sessionId', 'chairId'], { unique: true, where: "status = 'active'" })
export class Reservation {
  // ...
}
```

**Como funciona:**

- Banco de dados garante que não pode haver duas reservas ativas para o mesmo assento
- Mesmo que o código falhe, o banco previne duplicatas
- Condição parcial: aplica-se apenas a reservas ativas

**Vantagens:**

- Camada extra de segurança
- Funciona mesmo se houver bugs no código
- Performance: índice otimiza consultas

### 4. Expiração Automática de Reservas

**Implementação:**

```typescript
@Cron(CronExpression.EVERY_5_SECONDS)
async handleReservationExpiration(): Promise<void> {
  const expiredCount = await this.reservationService.expireReservations();
}
```

**Como funciona:**

- Job executado a cada 5 segundos
- Busca reservas com `expiresAt < NOW()` e `status = 'active'`
- Atualiza status para 'expired' em batch
- Libera assentos para novas reservas

**Por que não usar setTimeout/setInterval individual?**

- Em sistemas distribuídos, cada instância criaria seu próprio timer
- Poderia haver múltiplas expirações do mesmo registro
- Job centralizado garante uma única expiração

## Prevenção de Edge Cases

### 1. Race Condition: Dois Usuários no Último Assento

**Cenário:**

```
t0: Usuário A e B clicam simultaneamente no assento 5
t1: Ambos passam pela verificação de disponibilidade
t2: Ambos tentam criar reserva
```

**Solução:**

- `SELECT FOR UPDATE` bloqueia o assento durante a transação
- O primeiro a adquirir o lock cria a reserva
- O segundo recebe erro ao tentar bloquear (assento já bloqueado)
- Ou recebe erro ao verificar reservas existentes

### 2. Deadlock Prevention

**Cenário Potencial:**

```
Transação A: bloqueia assento 1, tenta bloquear assento 2
Transação B: bloqueia assento 2, tenta bloquear assento 1
```

**Solução:**

- Ordenação consistente dos locks (sempre por ID crescente)
- Timeout de transações (configurado no banco)
- Banco detecta deadlocks e aborta uma das transações

**Implementação:**

```typescript
// IDs sempre ordenados antes de bloquear
dto.chairIds.sort((a, b) => a - b);
```

### 3. Idempotência

**Cenário:**
Cliente reenvia requisição por timeout de rede.

**Solução para reservas:**

- Verificação de reservas existentes antes de criar nova
- Índice único previne duplicatas
- Retornar reserva existente se já houver uma ativa

**Implementação (seria necessário adicionar):**

```typescript
// Verificar se já existe reserva ativa deste usuário nestes assentos
const existing = await this.reservationRepository.findActiveByUserAndChairs(
  dto.userId,
  dto.chairIds,
);
if (existing) {
  return this.buildReservationResponse(existing);
}
```

### 4. Reservas Fantasmas (Não Confirmadas)

**Problema:**
Reservas que nunca são confirmadas nem canceladas.

**Solução:**

- Expiração automática após 30 segundos
- Job periódico limpa reservas expiradas
- Status claro: active, confirmed, expired, cancelled

## Modelo de Dados

### Entidades Principais

```
Session (Sessão de Cinema)
├── id: PK
├── movie: string
├── hour: timestamp
├── room: string
├── ticketPrice: decimal
└── chairs: OneToMany → Chair

Chair (Assento)
├── id: PK
├── row: string
├── number: int
├── sessionId: FK → Session
└── isAvailable: boolean

Reservation (Reserva Temporária)
├── id: PK
├── sessionId: FK → Session
├── chairId: FK → Chair
├── userId: FK → User
├── expiresAt: timestamp
└── status: enum (active, confirmed, expired, cancelled)

Sale (Venda Confirmada)
├── id: PK
├── sessionId: FK → Session
├── chairId: FK → Chair
├── userId: FK → User
├── reservationId: FK → Reservation
├── value: decimal
└── createdAt: timestamp

User (Usuário)
├── id: PK
├── name: string
└── cpf: string (unique)
```

### Índices para Performance

```sql
-- Prevenir reservas duplicadas
CREATE UNIQUE INDEX idx_reservation_session_chair
  ON reservations(session_id, chair_id)
  WHERE status = 'active';

-- Prevenir vendas duplicadas
CREATE UNIQUE INDEX idx_sale_session_chair
  ON sales(session_id, chair_id);

-- Buscar assentos por sessão
CREATE INDEX idx_chair_session
  ON chairs(session_id);

-- Buscar reservas expiradas
CREATE INDEX idx_reservation_expires
  ON reservations(expires_at)
  WHERE status = 'active';
```

## Sistema de Eventos

### Eventos Emitidos

1. **reservation.created**
   - Quando: Reserva é criada com sucesso
   - Payload: IDs das reservas, sessão, assentos, usuário
   - Uso: Notificações, analytics, auditoria

2. **payment.confirmed**
   - Quando: Pagamento é confirmado
   - Payload: IDs das vendas, valor total
   - Uso: Emissão de ingressos, nota fiscal, confirmação por email

3. **reservation.expired**
   - Quando: Reserva expira sem confirmação
   - Payload: ID da reserva, assento liberado
   - Uso: Notificar usuário, liberar assento

4. **chair.released**
   - Quando: Assento é liberado (cancelamento ou expiração)
   - Payload: ID do assento
   - Uso: Notificar usuários em fila de espera

### Integração com Mensageria (Futura)

O sistema está preparado para integração com RabbitMQ, Kafka ou Redis:

```typescript
@OnEvent('payment.confirmed')
async handlePaymentConfirmed(event: PaymentConfirmedEvent) {
  // Publicar no RabbitMQ/Kafka
  await this.messageBroker.publish('payment.confirmed', event);
}
```

## Validação e Tratamento de Erros

### Validação de Entrada (class-validator)

```typescript
export class CreateReservationDto {
  @IsNumber()
  sessionId: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  chairIds: number[];
}
```

### Tipos de Erros

| Código | Tipo                | Quando                            |
| ------ | ------------------- | --------------------------------- |
| 400    | BadRequest          | Dados inválidos, validação falhou |
| 404    | NotFound            | Recurso não existe                |
| 409    | Conflict            | Assento já reservado/vendido      |
| 500    | InternalServerError | Erro inesperado                   |

## Logging Estruturado

### Níveis de Log

```typescript
this.logger.log('INFO: Operação normal');
this.logger.warn('WARN: Situação suspeita mas não é erro');
this.logger.error('ERROR: Algo deu errado', stackTrace);
this.logger.debug('DEBUG: Informação detalhada para desenvolvimento');
```

### Informações Logadas

- Criação/confirmação de reservas
- Expiração de reservas
- Erros e exceções com stack trace
- Eventos emitidos

## Escalabilidade

### Horizontal Scaling

O sistema suporta múltiplas instâncias porque:

1. **Controle de concorrência no banco**: Locks pessimistas
2. **Transações ACID**: Garantem consistência
3. **Stateless**: Sem estado na aplicação
4. **Job de expiração**: Apenas uma instância precisa executar (coordenação via banco)

### Vertical Scaling

- Índices otimizados para queries frequentes
- Conexões do pool do TypeORM
- Transações curtas e eficientes

## Limitações Conhecidas

1. **Sem cache distribuído (Redis)**
   - Toda consulta vai ao banco
   - Poderia melhorar performance de leitura

2. **Sem fila de mensagens (RabbitMQ/Kafka)**
   - Eventos processados em memória
   - Não persistentes entre reinícios

3. **Sem rate limiting**
   - Vulnerável a ataques de força bruta
   - Poderia usar Redis para controlar

4. **Job de expiração simples**
   - Executa em todas as instâncias (ineficiente)
   - Deveria usar lock distribuído ou fila

## Melhorias Futuras

### Curto Prazo

1. **Redis para cache**

   ```typescript
   // Cache de disponibilidade de sessões (TTL 5s)
   const availability = await this.redis.get(`session:${id}:availability`);
   if (availability) return JSON.parse(availability);
   ```

2. **Rate Limiting**

   ```typescript
   @UseGuards(ThrottlerGuard)
   @Throttle(10, 60) // 10 requisições por minuto
   async createReservation() { }
   ```

3. **Swagger/OpenAPI**
   ```typescript
   @ApiOperation({ summary: 'Criar nova reserva' })
   @ApiResponse({ status: 201, type: ReservationResponseDto })
   ```

### Médio Prazo

1. **RabbitMQ para eventos**
   - Garantia de entrega de mensagens
   - Reprocessamento de falhas
   - Dead Letter Queue

2. **Coordenação distribuída**
   - Redis para locks distribuídos
   - Job de expiração centralizado

3. **Observabilidade**
   - Prometheus para métricas
   - Grafana para dashboards
   - Tracing distribuído (Jaeger)

### Longo Prazo

1. **CQRS (Command Query Responsibility Segregation)**
   - Separar leitura de escrita
   - Réplicas de leitura

2. **Event Sourcing**
   - Histórico completo de eventos
   - Auditoria detalhada

3. **Microserviços**
   - Sessões em um serviço
   - Reservas/Vendas em outro
   - Comunicação via eventos

## Performance Estimada

### Benchmarks Esperados

- **Criação de reserva**: ~50-100ms (com locks)
- **Consulta de disponibilidade**: ~10-30ms
- **Confirmação de pagamento**: ~100-200ms
- **Expiração de reservas**: ~500ms para 1000 reservas

### Bottlenecks Identificados

1. Locks pessimistas aumentam latência
2. Transações SERIALIZABLE podem causar retries
3. Consultas de disponibilidade sem cache

### Mitigações

1. Usar cache para leituras frequentes
2. Índices otimizados
3. Connection pooling adequado
4. Considerar locks otimistas onde apropriado
