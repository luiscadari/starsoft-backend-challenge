import { DataSource } from 'typeorm';
import { Session } from './src/models/session.models';
import { Chair } from './src/models/chairs.models';
import { User } from './src/models/user.models';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'cinema_user',
  password: process.env.DB_PASSWORD || 'cinema_password',
  database: process.env.DB_DATABASE || 'cinema_db',
  entities: [Session, Chair, User],
  synchronize: true,
});

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...');

  await AppDataSource.initialize();
  console.log('✅ Conectado ao banco de dados');

  const sessionRepository = AppDataSource.getRepository(Session);
  const chairRepository = AppDataSource.getRepository(Chair);
  const userRepository = AppDataSource.getRepository(User);

  // Limpar dados existentes
  await chairRepository.delete({});
  await sessionRepository.delete({});
  await userRepository.delete({});
  console.log('🧹 Dados antigos removidos');

  // Criar usuários de teste
  const users = [
    { name: 'João Silva', cpf: '12345678901' },
    { name: 'Maria Santos', cpf: '98765432100' },
    { name: 'Pedro Costa', cpf: '11122233344' },
    { name: 'Ana Oliveira', cpf: '55566677788' },
  ];

  for (const userData of users) {
    const user = userRepository.create(userData);
    await userRepository.save(user);
  }
  console.log(`👥 ${users.length} usuários criados`);

  // Criar sessões de teste
  const sessions = [
    {
      movie: 'Avatar 3',
      hour: new Date('2026-02-01T19:00:00'),
      room: 'Sala 1',
      ticketPrice: 25.0,
    },
    {
      movie: 'Vingadores: Kang Dynasty',
      hour: new Date('2026-02-01T21:00:00'),
      room: 'Sala 2',
      ticketPrice: 30.0,
    },
    {
      movie: 'Matrix 5',
      hour: new Date('2026-02-02T18:00:00'),
      room: 'Sala 1',
      ticketPrice: 28.0,
    },
  ];

  for (const sessionData of sessions) {
    const session = sessionRepository.create(sessionData);
    const savedSession = await sessionRepository.save(session);

    // Criar assentos (4 fileiras com 4 assentos cada = 16 assentos)
    const rows = ['A', 'B', 'C', 'D'];
    const seatsPerRow = 4;

    for (const row of rows) {
      for (let number = 1; number <= seatsPerRow; number++) {
        const chair = chairRepository.create({
          row,
          number,
          sessionId: savedSession.id,
          isAvailable: true,
        });
        await chairRepository.save(chair);
      }
    }

    console.log(
      `🎬 Sessão criada: ${sessionData.movie} - ${rows.length * seatsPerRow} assentos`,
    );
  }

  console.log('✅ Seed concluído com sucesso!');
  console.log('\n📊 Resumo:');
  console.log(`   - ${users.length} usuários criados`);
  console.log(`   - ${sessions.length} sessões criadas`);
  console.log(`   - ${sessions.length * 16} assentos criados`);

  await AppDataSource.destroy();
}

seed()
  .then(() => {
    console.log('\n🎉 Processo finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  });
