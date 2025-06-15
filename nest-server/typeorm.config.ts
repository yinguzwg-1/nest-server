import { DataSource } from 'typeorm';
import { Media } from './src/entities/media.entity';

export default new DataSource({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'qq123456',
    database: 'nest_db',
    synchronize: false,
    logging: true,
    entities: [Media],
    migrations: ['src/migrations/*.ts'],
    subscribers: [],
}); 