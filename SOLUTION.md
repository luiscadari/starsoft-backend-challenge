# Sistema de Vendas de Ingressos de Cinema

Sistema robusto para gerenciamento de vendas de ingressos de cinema com suporte a alta concorrência, garantindo que nenhum assento seja vendido duas vezes mesmo com múltiplas instâncias da aplicação rodando simultaneamente.

## 🚀 Tecnologias Utilizadas

- **NestJS 11** - Framework Node.js progressivo
- **TypeScript** - Tipagem estática
- **TypeORM** - ORM para comunicação com banco de dados
- **PostgreSQL** - Banco de dados relacional
- **class-validator** - Validação de DTOs
- **@nestjs/schedule** - Agendamento de tarefas (cron jobs)
- **@nestjs/event-emitter** - Sistema de eventos

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd starsoft-backend-challenge
```

### 2. Instale as dependências

```bash
npm install --legacy-peer-deps
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=cinema_user
DB_PASSWORD=cinema_password
DB_DATABASE=cinema_db
DB_LOGGING=false
```

### 4. Crie o banco de dados

```bash
# Conecte ao PostgreSQL
psql -U postgres

# Crie o usuário e o banco
CREATE USER cinema_user WITH PASSWORD 'cinema_password';
CREATE DATABASE cinema_db OWNER cinema_user;
GRANT ALL PRIVILEGES ON DATABASE cinema_db TO cinema_user;
\q
```

### 5. Execute a aplicação

```bash
# Modo desenvolvimento (com hot reload)
npm run start:dev

# Modo produção
npm run build
npm run start:prod
```

A aplicação estará rodando em `http://localhost:3000`

### 6. Popular o banco com dados iniciais

```bash
npm run seed
```

## 📚 Documentação da API

### Endpoints Disponíveis

#### Sessões

- **POST** `/sessions` - Criar nova sessão de cinema
- **GET** `/sessions` - Listar todas as sessões
- **GET** `/sessions/:id/availability` - Ver disponibilidade em tempo real

#### Reservas

- **POST** `/reservations` - Reservar assento(s)
- **POST** `/reservations/confirm-payment` - Confirmar pagamento

#### Vendas

- **GET** `/sales/user/:userId` - Histórico de compras por usuário

#### Usuários

- **POST** `/users` - Criar novo usuário
- **GET** `/users/:id` - Buscar usuário por ID

Para exemplos detalhados de uso, consulte [API.md](./API.md)

## 🧪 Testando a Aplicação

### Fluxo Completo de Teste

```bash
# 1. Criar um usuário
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "João Silva", "cpf": "12345678901"}'

# 2. Listar sessões disponíveis
curl http://localhost:3000/sessions

# 3. Ver disponibilidade da sessão 1
curl http://localhost:3000/sessions/1/availability

# 4. Reservar 2 assentos (válido por 30 segundos)
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": 1,
    "userId": 1,
    "chairIds": [1, 2]
  }'

# 5. Confirmar pagamento (antes de expirar)
curl -X POST http://localhost:3000/reservations/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{"reservationId": 1, "userId": 1}'

# 6. Ver histórico de compras
curl http://localhost:3000/sales/user/1
```

Para testes mais detalhados, incluindo testes de concorrência, consulte [TESTING.md](./TESTING.md)

## 🏗️ Arquitetura e Estratégias Implementadas

### Controle de Concorrência

O sistema implementa múltiplas camadas de proteção contra race conditions:

#### 1. **Pessimistic Locking (SELECT FOR UPDATE)**

```typescript
// Bloqueia os assentos durante a transação
const chairs = await this.dataSource
  .createQueryBuilder()
  .select('chair')
  .from(Chair, 'chair')
  .where('chair.id IN (:...chairIds)', { chairIds })
  .setLock('pessimistic_write') // ← Lock pessimista
  .getMany();
```

**Garantia:** Quando um usuário está reservando um assento, nenhum outro pode acessá-lo até a transação terminar.

#### 2. **Transações com Isolamento SERIALIZABLE**

```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.startTransaction('SERIALIZABLE');
```

**Garantia:** Transações concorrentes são executadas como se fossem sequenciais, prevenindo anomalias.

#### 3. **Índices Únicos Compostos**

```typescript
@Index(['sessionId', 'chairId'], {
  unique: true,
  where: 'status = \'active\''
})
```

**Garantia:** O banco de dados fisicamente impede duas reservas ativas para o mesmo assento.

#### 4. **Expiração Automática de Reservas**

```typescript
@Cron(CronExpression.EVERY_5_SECONDS)
async handleReservationExpiration() {
  // Expira reservas não confirmadas após 30 segundos
}
```

**Garantia:** Assentos reservados mas não pagos são automaticamente liberados.

### Prevenção de Edge Cases

✅ **Race Condition:** 2 usuários clicam no último assento simultaneamente

- **Solução:** Locks pessimistas + transações SERIALIZABLE

✅ **Deadlock:** Usuário A reserva [1,3], Usuário B reserva [3,1] simultaneamente

- **Solução:** IDs sempre ordenados + timeout de transação + detecção pelo banco

✅ **Idempotência:** Cliente reenvia requisição por timeout

- **Solução:** Índices únicos previnem duplicatas + verificação de reservas existentes

✅ **Expiração:** Reservas não confirmadas bloqueando assentos

- **Solução:** Job cron expira reservas automaticamente a cada 5 segundos

## 🔄 Sistema de Eventos

O sistema emite eventos para todas as operações importantes:

```typescript
// Eventos disponíveis
-reservation.created - // Quando uma reserva é criada
  payment.confirmed - // Quando um pagamento é confirmado
  reservation.expired - // Quando uma reserva expira
  chair.released; // Quando um assento é liberado
```

Estes eventos podem ser facilmente integrados com RabbitMQ, Kafka ou Redis para processamento assíncrono.

## 📊 Estrutura do Projeto

```
src/
├── controller/           # Controllers (rotas HTTP)
│   ├── session.controller.ts
│   ├── reservation.controller.ts
│   ├── sale.controller.ts
│   └── user.controller.ts
├── services/            # Lógica de negócio
│   ├── session.service.ts
│   ├── reservation.service.ts
│   ├── sale.service.ts
│   ├── event-emitter.service.ts
│   └── reservation-expiration.job.ts
├── repositories/        # Acesso aos dados
│   ├── session.repository.ts
│   ├── chair.repository.ts
│   ├── reservation.repository.ts
│   ├── sale.repository.ts
│   └── user.repository.ts
├── models/             # Entidades TypeORM
│   ├── session.models.ts
│   ├── chairs.models.ts
│   ├── reservation.models.ts
│   ├── sales.models.ts
│   └── user.models.ts
├── dto/                # Data Transfer Objects
│   ├── create-session.dto.ts
│   ├── create-reservation.dto.ts
│   ├── confirm-payment.dto.ts
│   └── ...
├── app.module.ts       # Módulo principal
└── main.ts            # Bootstrap da aplicação
```

## 🎯 Decisões Técnicas

### Por que PostgreSQL?

- Suporte robusto a locks pessimistas (SELECT FOR UPDATE)
- Índices parciais (WHERE na definição do índice)
- ACID completo com múltiplos níveis de isolamento
- Ampla adoção e documentação

### Por que TypeORM?

- Integração nativa com NestJS
- Suporte a transações complexas
- Query builder poderoso
- Migrations automáticas em desenvolvimento

### Por que Pessimistic Locking em vez de Optimistic?

**Pessimistic Locking:**

- ✅ Previne conflitos desde o início
- ✅ Melhor para operações críticas (venda de ingressos)
- ❌ Pode causar contenção em alta carga

**Optimistic Locking:**

- ✅ Melhor performance em cenários de baixa contenção
- ❌ Requer retries no cliente
- ❌ Experiência do usuário pior (falha após escolher assento)

**Decisão:** Em um sistema de venda de ingressos, preferimos garantir a consistência desde o início.

### Por que Event Emitter em vez de RabbitMQ/Kafka?

**Fase Atual:** Sistema funcional sem dependências externas adicionais

**Migração Futura:** A arquitetura permite fácil substituição:

```typescript
@OnEvent('payment.confirmed')
async handlePayment(event) {
  await this.rabbitMQ.publish('payment.confirmed', event);
}
```

## ⚠️ Limitações Conhecidas

1. **Sem cache distribuído (Redis)**
   - Toda consulta de disponibilidade vai ao banco
   - Potencial melhoria: cache com TTL de 1-2 segundos

2. **Sem fila de mensagens persistente**
   - Eventos processados em memória
   - Não sobrevivem a reinícios da aplicação

3. **Job de expiração em todas as instâncias**
   - Ineficiente em deployment com múltiplas instâncias
   - Solução futura: lock distribuído ou fila de jobs

4. **Sem rate limiting**
   - Vulnerável a ataques de força bruta
   - Solução: implementar throttling por IP/usuário

5. **Vulnerabilidades de dependências transitivas**
   - 4 vulnerabilidades moderadas no lodash (dependência do @nestjs/config)
   - Impacto mínimo: lodash usado apenas internamente pelo framework
   - Detalhes completos em [SECURITY.md](./SECURITY.md)

## 🔒 Segurança

### Análise de Vulnerabilidades

O projeto possui **4 vulnerabilidades moderadas** reportadas pelo `npm audit`:

```bash
4 moderate severity vulnerabilities
```

**Status:** ✅ Risco Aceito e Documentado

**Resumo:**

- Vulnerabilidades são no pacote `lodash` (dependência transitiva)
- Tipo: Prototype Pollution em `_.unset` e `_.omit`
- Severidade: Moderada (não crítica)
- **Impacto real: MÍNIMO** - lodash não é usado diretamente no código
- Exploração requer condições específicas não presentes na aplicação

**Mitigações implementadas:**

- ✅ Validação rigorosa de todos os inputs com `class-validator`
- ✅ TypeScript em modo strict
- ✅ Nenhum uso direto das funções vulneráveis
- ✅ Overrides configurados no package.json
- ✅ Documentação completa em [SECURITY.md](./SECURITY.md)

Para análise detalhada, consulte [SECURITY.md](./SECURITY.md)

## 🚀 Melhorias Futuras

### Curto Prazo (1-2 semanas)

- [ ] Implementar Swagger/OpenAPI para documentação interativa
- [ ] Adicionar testes unitários (Jest)
- [ ] Implementar rate limiting com @nestjs/throttler
- [ ] Adicionar validação de CPF

### Médio Prazo (1 mês)

- [ ] Integrar Redis para cache de disponibilidade
- [ ] Implementar RabbitMQ para eventos
- [ ] Adicionar testes de integração
- [ ] Implementar Dead Letter Queue (DLQ)
- [ ] Retry com backoff exponencial

### Longo Prazo (3 meses)

- [ ] Observabilidade (Prometheus + Grafana)
- [ ] Tracing distribuído (Jaeger)
- [ ] CQRS para separar leitura/escrita
- [ ] Event Sourcing para auditoria completa
- [ ] Kubernetes deployment

## 📖 Documentação Adicional

- [API.md](./API.md) - Documentação completa da API com exemplos
- [TESTING.md](./TESTING.md) - Guia de testes e casos de uso
- [TECHNICAL.md](./TECHNICAL.md) - Documentação técnica detalhada

## 👤 Autor

Desenvolvido para o desafio técnico Starsoft Backend Challenge

## 📝 Licença

Este projeto está sob a licença UNLICENSED - veja o arquivo package.json para detalhes.
