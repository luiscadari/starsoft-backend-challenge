import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'root',
  password: 'root',
  database: 'cinema',
  synchronize: true,
  logging: true,
  entities: [],
  subscribers: [],
  migrations: [],
});

async function initializeDB(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');
  } catch (error) {
    console.error('Error during Data Source initialization:', error);
  }
}
initializeDB();
