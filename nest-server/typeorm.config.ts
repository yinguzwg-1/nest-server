const { DataSource } = require('typeorm');
const { ConfigService } = require('@nestjs/config');
const { config } = require('dotenv');
const { Media } = require('./src/media/entities');
const { Translation } = require('./src/translation/entities');

config();

const configService = new ConfigService();

module.exports = new DataSource({
    type: 'mysql',
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
    synchronize: false,
    logging: true,
    entities: [Media, Translation],
    migrations: ['src/migrations/*.ts'],
    subscribers: [],
}); 