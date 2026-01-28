# Guia de Testes - Sistema de Vendas de Ingressos de Cinema

Este documento contém exemplos práticos de como testar a API do sistema de vendas de ingressos.

## Pré-requisitos

- API rodando em `http://localhost:3000`
- Banco de dados populado com `npm run seed`

## 1. Testando Criação de Usuários

### Criar Usuário 1

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Carlos Teste",
    "cpf": "11111111111"
  }'
```

**Resposta esperada:**

```json
{
  "id": 5,
  "name": "Carlos Teste",
  "cpf": "11111111111",
  "createdAt": "2026-01-27T...",
  "updatedAt": "2026-01-27T..."
}
```

### Criar Usuário 2

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Paula Teste",
    "cpf": "22222222222"
  }'
```

## 2. Testando Criação de Sessões

### Criar uma Nova Sessão

```bash
curl -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "movie": "Interestelar 2",
    "hour": "2026-02-03T20:00:00.000Z",
    "room": "Sala 3",
    "ticketPrice": 35.00,
    "chairs": [
      {"row": "A", "number": 1},
      {"row": "A", "number": 2},
      {"row": "A", "number": 3},
      {"row": "A", "number": 4},
      {"row": "B", "number": 1},
      {"row": "B", "number": 2},
      {"row": "B", "number": 3},
      {"row": "B", "number": 4},
      {"row": "C", "number": 1},
      {"row": "C", "number": 2},
      {"row": "C", "number": 3},
      {"row": "C", "number": 4},
      {"row": "D", "number": 1},
      {"row": "D", "number": 2},
      {"row": "D", "number": 3},
      {"row": "D", "number": 4}
    ]
  }'
```

### Listar Todas as Sessões

```bash
curl http://localhost:3000/sessions
```

## 3. Testando Disponibilidade de Assentos

### Verificar Disponibilidade da Sessão 1

```bash
curl http://localhost:3000/sessions/1/availability
```

**Resposta esperada:**

```json
{
  "sessionId": 1,
  "movie": "Avatar 3",
  "hour": "2026-02-01T19:00:00.000Z",
  "room": "Sala 1",
  "ticketPrice": 25.00,
  "totalSeats": 16,
  "availableSeats": 16,
  "reservedSeats": 0,
  "soldSeats": 0,
  "chairs": [
    {
      "id": 1,
      "row": "A",
      "number": 1,
      "status": "available"
    },
    ...
  ]
}
```

## 4. Testando Reserva de Assentos

### Reservar 2 Assentos (Usuário 1)

```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": 1,
    "userId": 1,
    "chairIds": [1, 2]
  }'
```

**Resposta esperada:**

```json
{
  "reservationId": 1,
  "sessionId": 1,
  "chairIds": [1, 2],
  "userId": 1,
  "expiresAt": "2026-01-27T10:30:00.000Z",
  "expiresInSeconds": 30
}
```

### Verificar que os Assentos Estão Reservados

```bash
curl http://localhost:3000/sessions/1/availability
```

Agora os assentos 1 e 2 devem ter `status: "reserved"`.

## 5. Testando Concorrência (Race Condition)

### Terminal 1: Tentar Reservar Assento 3

```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": 1,
    "userId": 1,
    "chairIds": [3]
  }'
```

### Terminal 2: Simultaneamente, Outro Usuário Tenta Reservar o Mesmo Assento

```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": 1,
    "userId": 2,
    "chairIds": [3]
  }'
```

**Resultado esperado:** Um dos usuários deve receber sucesso e o outro deve receber erro 409 (Conflict).

## 6. Testando Confirmação de Pagamento

### Confirmar Pagamento da Reserva 1

```bash
curl -X POST http://localhost:3000/reservations/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": 1,
    "userId": 1
  }'
```

**Resposta esperada:**

```json
{
  "success": true,
  "saleIds": [1, 2]
}
```

### Verificar que os Assentos Agora Estão Vendidos

```bash
curl http://localhost:3000/sessions/1/availability
```

Os assentos 1 e 2 agora devem ter `status: "sold"`.

## 7. Testando Expiração de Reservas

### Fazer uma Reserva

```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": 1,
    "userId": 2,
    "chairIds": [4]
  }'
```

### Aguardar 30 Segundos

### Tentar Confirmar Pagamento Após Expiração

```bash
curl -X POST http://localhost:3000/reservations/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": 2,
    "userId": 2
  }'
```

**Resultado esperado:** Erro 400 informando que a reserva expirou.

### Verificar que o Assento Está Disponível Novamente

```bash
curl http://localhost:3000/sessions/1/availability
```

O assento 4 deve voltar ao status `available`.

## 8. Testando Histórico de Compras

### Ver Histórico do Usuário 1

```bash
curl http://localhost:3000/sales/user/1
```

**Resposta esperada:**

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

## 9. Testando Erro: Assento Já Vendido

### Tentar Reservar um Assento Já Vendido

```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": 1,
    "userId": 2,
    "chairIds": [1]
  }'
```

**Resposta esperada:** Erro 409

```json
{
  "statusCode": 409,
  "message": "Assentos já vendidos: 1",
  "error": "Conflict"
}
```

## 10. Teste de Carga: Múltiplos Usuários Simultâneos

Para simular múltiplos usuários tentando comprar os últimos assentos disponíveis:

```bash
# Criar script de teste (save as test-concurrency.sh)
#!/bin/bash

for i in {1..10}
do
  curl -X POST http://localhost:3000/reservations \
    -H "Content-Type: application/json" \
    -d "{
      \"sessionId\": 1,
      \"userId\": $i,
      \"chairIds\": [10, 11]
    }" &
done

wait
```

Execute:

```bash
chmod +x test-concurrency.sh
./test-concurrency.sh
```

**Resultado esperado:** Apenas uma reserva deve ter sucesso. As outras devem retornar erro 409 (Conflict).

## 11. Testando Validações

### Tentar Criar Sessão com Menos de 16 Assentos

```bash
curl -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "movie": "Teste",
    "hour": "2026-02-03T20:00:00.000Z",
    "room": "Sala 4",
    "ticketPrice": 20.00,
    "chairs": [
      {"row": "A", "number": 1},
      {"row": "A", "number": 2}
    ]
  }'
```

**Resposta esperada:** Erro 400

```json
{
  "statusCode": 400,
  "message": ["A sessão deve ter no mínimo 16 assentos"],
  "error": "Bad Request"
}
```

### Tentar Reservar Sem Especificar Assentos

```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": 1,
    "userId": 1,
    "chairIds": []
  }'
```

**Resposta esperada:** Erro 400

```json
{
  "statusCode": 400,
  "message": ["Deve haver pelo menos um assento na reserva"],
  "error": "Bad Request"
}
```

## 12. Monitorando Logs

Enquanto testa, observe os logs da aplicação para ver:

- Eventos sendo emitidos
- Job de expiração executando a cada 5 segundos
- Mensagens de DEBUG, INFO, WARN, ERROR

```bash
# Em outro terminal, acompanhe os logs
npm run start:dev
```

## Resumo dos Códigos de Status HTTP

- **200 OK**: Operação bem-sucedida (GET, confirmação de pagamento)
- **201 Created**: Recurso criado com sucesso (POST)
- **400 Bad Request**: Dados inválidos ou requisição mal formada
- **404 Not Found**: Recurso não encontrado
- **409 Conflict**: Conflito (assento já reservado ou vendido)
- **500 Internal Server Error**: Erro interno do servidor
