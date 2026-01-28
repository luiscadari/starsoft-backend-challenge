# Coleção Bruno - Starsoft Backend Challenge API

Esta coleção contém todas as requisições HTTP para testar a API do desafio backend da Starsoft.

## 📋 Sobre a API

Sistema de reserva de ingressos de cinema com as seguintes funcionalidades:

- Gerenciamento de usuários
- Criação e consulta de sessões
- Reserva temporária de assentos (30 segundos)
- Confirmação de pagamento
- Histórico de compras

## 🚀 Como usar

1. Instale o [Bruno](https://www.usebruno.com/)
2. Abra a pasta `.bruno` no Bruno
3. Configure o ambiente "Local" se necessário (padrão: http://localhost:3000)
4. Execute as requisições na ordem sugerida

## 📁 Estrutura da Coleção

### 👤 Users (Usuários)

- **Create User** - Criar novo usuário
- **Get User By ID** - Buscar usuário por ID

### 🎬 Sessions (Sessões)

- **Create Session** - Criar nova sessão de cinema
- **Get All Sessions** - Listar todas as sessões
- **Get Session Availability** - Ver disponibilidade de assentos em tempo real

### 🎫 Reservations (Reservas)

- **Create Reservation** - Reservar assentos (válido por 30 segundos)
- **Confirm Payment** - Confirmar pagamento e finalizar compra

### 💰 Sales (Vendas)

- **Get User Purchase History** - Ver histórico de compras do usuário

## 🔄 Fluxo de Teste Sugerido

1. **Criar Usuário**

   ```
   POST /users
   ```

2. **Criar Sessão**

   ```
   POST /sessions
   ```

3. **Ver Disponibilidade**

   ```
   GET /sessions/:id/availability
   ```

4. **Fazer Reserva**

   ```
   POST /reservations
   ```

   ⏱️ **Atenção**: A reserva expira em 30 segundos!

5. **Confirmar Pagamento**

   ```
   POST /reservations/confirm-payment
   ```

   ✅ Deve ser feito antes da expiração

6. **Ver Histórico de Compras**
   ```
   GET /sales/user/:userId
   ```

## ⚙️ Variáveis de Ambiente

O ambiente "Local" está configurado com:

- `baseUrl`: http://localhost:3000

Você pode criar outros ambientes (Development, Production, etc.) conforme necessário.

## 📝 Notas Importantes

- **Reservas expiram em 30 segundos** - Complete o pagamento rapidamente!
- **IDs são numéricos** - Substitua os valores de exemplo pelos IDs reais retornados
- **Status dos assentos**:
  - `available`: Disponível para reserva
  - `reserved`: Temporariamente reservado
  - `sold`: Vendido (não disponível)

## 🐛 Troubleshooting

- Certifique-se de que a API está rodando em http://localhost:3000
- Verifique se o banco de dados está configurado corretamente
- Use IDs válidos nas requisições
- Respeite o tempo de expiração das reservas

## 📚 Documentação Adicional

Para mais detalhes sobre a API, consulte:

- `API.md` - Documentação completa da API
- `TECHNICAL.md` - Detalhes técnicos da implementação
- `TESTING.md` - Guia de testes
