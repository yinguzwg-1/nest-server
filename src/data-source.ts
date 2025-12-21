import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'Qq123456!',
  database: 'nest_db',
  synchronize: false,
  logging: true,
  entities: [],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});
