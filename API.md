# API Documentation - Cinema Ticket System

## Base URL

```
http://localhost:3000
```

## Endpoints

### 1. Gestão de Sessões

#### 1.1. Criar Sessão

Cria uma nova sessão de cinema com assentos disponíveis.

**Endpoint:** `POST /sessions`

**Request Body:**

```json
{
  "movie": "Avatar 3",
  "hour": "2026-02-01T19:00:00.000Z",
  "room": "Sala 1",
  "ticketPrice": 25.0,
  "chairs": [
    { "row": "A", "number": 1 },
    { "row": "A", "number": 2 },
    { "row": "A", "number": 3 },
    { "row": "A", "number": 4 },
    { "row": "B", "number": 1 },
    { "row": "B", "number": 2 },
    { "row": "B", "number": 3 },
    { "row": "B", "number": 4 },
    { "row": "C", "number": 1 },
    { "row": "C", "number": 2 },
    { "row": "C", "number": 3 },
    { "row": "C", "number": 4 },
    { "row": "D", "number": 1 },
    { "row": "D", "number": 2 },
    { "row": "D", "number": 3 },
    { "row": "D", "number": 4 }
  ]
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "movie": "Avatar 3",
  "hour": "2026-02-01T19:00:00.000Z",
  "room": "Sala 1",
  "ticketPrice": "25.00",
  "chairs": [
    {
      "id": 1,
      "row": "A",
      "number": 1,
      "isAvailable": true,
      "sessionId": 1
    }
    // ... mais assentos
  ],
  "createdAt": "2026-01-27T10:00:00.000Z",
  "updatedAt": "2026-01-27T10:00:00.000Z"
}
```

**Validações:**

- Mínimo de 16 assentos obrigatórios
- Preço do ingresso deve ser maior ou igual a 0

---

#### 1.2. Listar Todas as Sessões

Lista todas as sessões disponíveis, ordenadas por horário.

**Endpoint:** `GET /sessions`

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "movie": "Avatar 3",
    "hour": "2026-02-01T19:00:00.000Z",
    "room": "Sala 1",
    "ticketPrice": "25.00",
    "chairs": [...],
    "createdAt": "2026-01-27T10:00:00.000Z",
    "updatedAt": "2026-01-27T10:00:00.000Z"
  }
]
```

---

#### 1.3. Buscar Disponibilidade em Tempo Real

Retorna a disponibilidade de assentos de uma sessão em tempo real.

**Endpoint:** `GET /sessions/:id/availability`

**Response:** `200 OK`

```json
{
  "sessionId": 1,
  "movie": "Avatar 3",
  "hour": "2026-02-01T19:00:00.000Z",
  "room": "Sala 1",
  "ticketPrice": 25.0,
  "totalSeats": 16,
  "availableSeats": 14,
  "reservedSeats": 1,
  "soldSeats": 1,
  "chairs": [
    {
      "id": 1,
      "row": "A",
      "number": 1,
      "status": "available"
    },
    {
      "id": 2,
      "row": "A",
      "number": 2,
      "status": "reserved"
    },
    {
      "id": 3,
      "row": "A",
      "number": 3,
      "status": "sold"
    }
    // ... mais assentos
  ]
}
```

**Status dos assentos:**

- `available`: Disponível para reserva
- `reserved`: Reservado (aguardando confirmação de pagamento)
- `sold`: Vendido (pagamento confirmado)

---

### 2. Gestão de Reservas

#### 2.1. Criar Reserva

Reserva assento(s) temporariamente por 30 segundos.

**Endpoint:** `POST /reservations`

**Request Body:**

```json
{
  "sessionId": 1,
  "userId": 1,
  "chairIds": [1, 2]
}
```

**Response:** `201 Created`

```json
{
  "reservationId": 1,
  "sessionId": 1,
  "chairIds": [1, 2],
  "userId": 1,
  "expiresAt": "2026-01-27T10:00:30.000Z",
  "expiresInSeconds": 30
}
```

**Possíveis Erros:**

- `404 Not Found`: Sessão ou usuário não encontrado
- `404 Not Found`: Assento não encontrado nesta sessão
- `409 Conflict`: Assento já vendido
- `409 Conflict`: Assento já reservado (aguardar expiração)

**Proteção contra Race Conditions:**

- Utiliza `SELECT FOR UPDATE` (pessimistic locking)
- Nível de isolamento `SERIALIZABLE`
- Índice único composto para prevenir duplicatas

---

#### 2.2. Confirmar Pagamento

Confirma o pagamento e converte a reserva em venda definitiva.

**Endpoint:** `POST /reservations/confirm-payment`

**Request Body:**

```json
{
  "reservationId": 1,
  "userId": 1
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "saleIds": [1, 2]
}
```

**Possíveis Erros:**

- `404 Not Found`: Reserva não encontrada
- `400 Bad Request`: Usuário sem permissão
- `400 Bad Request`: Reserva não está ativa
- `400 Bad Request`: Reserva já expirou

**Comportamento:**

- Confirma todas as reservas do mesmo grupo (mesma sessão/usuário)
- Cria registros de venda
- Emite evento `payment.confirmed`

---

### 3. Gestão de Vendas

#### 3.1. Histórico de Compras por Usuário

Retorna o histórico de compras de um usuário.

**Endpoint:** `GET /sales/user/:userId`

**Response:** `200 OK`

```json
[
  {
    "saleId": 1,
    "sessionId": 1,
    "movie": "Avatar 3",
    "hour": "2026-02-01T19:00:00.000Z",
    "room": "Sala 1",
    "chairRow": "A",
    "chairNumber": 1,
    "value": 25.0,
    "purchasedAt": "2026-01-27T10:00:15.000Z"
  },
  {
    "saleId": 2,
    "sessionId": 1,
    "movie": "Avatar 3",
    "hour": "2026-02-01T19:00:00.000Z",
    "room": "Sala 1",
    "chairRow": "A",
    "chairNumber": 2,
    "value": 25.0,
    "purchasedAt": "2026-01-27T10:00:15.000Z"
  }
]
```

---

### 4. Gestão de Usuários

#### 4.1. Criar Usuário

Cria um novo usuário no sistema.

**Endpoint:** `POST /users`

**Request Body:**

```json
{
  "name": "João Silva",
  "cpf": "12345678901"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "name": "João Silva",
  "cpf": "12345678901",
  "createdAt": "2026-01-27T10:00:00.000Z",
  "updatedAt": "2026-01-27T10:00:00.000Z"
}
```

---

#### 4.2. Buscar Usuário por ID

Busca um usuário pelo ID.

**Endpoint:** `GET /users/:id`

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "João Silva",
  "cpf": "12345678901",
  "createdAt": "2026-01-27T10:00:00.000Z",
  "updatedAt": "2026-01-27T10:00:00.000Z"
}
```

---

## Eventos do Sistema

O sistema emite eventos assíncronos para as seguintes ações:

### 1. `reservation.created`

Emitido quando uma ou mais reservas são criadas.

**Payload:**

```typescript
{
  reservationIds: number[];
  sessionId: number;
  chairIds: number[];
  userId: number;
  expiresAt: Date;
}
```

---

### 2. `payment.confirmed`

Emitido quando um pagamento é confirmado e a reserva é convertida em venda.

**Payload:**

```typescript
{
  reservationIds: number[];
  saleIds: number[];
  sessionId: number;
  userId: number;
  totalValue: number;
}
```

---

### 3. `reservation.expired`

Emitido quando uma reserva expira sem confirmação de pagamento.

**Payload:**

```typescript
{
  reservationId: number;
  sessionId: number;
  chairId: number;
}
```

---

### 4. `chair.released`

Emitido quando um assento é liberado (pode ser usado para notificações).

**Payload:**

```typescript
{
  chairId: number;
  sessionId: number;
}
```

---

## Fluxo de Uso Completo

### Cenário: Compra de 2 ingressos

1. **Criar usuário:**

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Santos",
    "cpf": "98765432100"
  }'
```

2. **Criar sessão:**

```bash
curl -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "movie": "Avatar 3",
    "hour": "2026-02-01T19:00:00.000Z",
    "room": "Sala 1",
    "ticketPrice": 25.00,
    "chairs": [
      {"row": "A", "number": 1},
      {"row": "A", "number": 2},
      ...16 assentos no total
    ]
  }'
```

3. **Verificar disponibilidade:**

```bash
curl http://localhost:3000/sessions/1/availability
```

4. **Reservar assentos:**

```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": 1,
    "userId": 1,
    "chairIds": [1, 2]
  }'
```

5. **Confirmar pagamento (dentro de 30 segundos):**

```bash
curl -X POST http://localhost:3000/reservations/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": 1,
    "userId": 1
  }'
```

6. **Verificar histórico de compras:**

```bash
curl http://localhost:3000/sales/user/1
```

---

## Tratamento de Erros

Todos os endpoints podem retornar os seguintes códigos de erro:

- `400 Bad Request`: Dados inválidos ou requisição mal formada
- `404 Not Found`: Recurso não encontrado
- `409 Conflict`: Conflito (ex: assento já reservado/vendido)
- `500 Internal Server Error`: Erro interno do servidor

**Formato de resposta de erro:**

```json
{
  "statusCode": 409,
  "message": "Assentos já reservados: 1, 2. Aguarde a expiração da reserva.",
  "error": "Conflict"
}
```
