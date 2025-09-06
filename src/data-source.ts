import { DataSource } from 'typeorm';
import { Media } from './media/entities';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'Qq123456!',
  database: 'nest_db',
  synchronize: false,
  logging: true,
  entities: [Media],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});
