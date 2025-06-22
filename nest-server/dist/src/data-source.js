"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const entities_1 = require("./media/entities");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'qq123456',
    database: 'nest_db',
    synchronize: false,
    logging: true,
    entities: [entities_1.Media],
    migrations: ['src/migrations/*.ts'],
    subscribers: [],
});
//# sourceMappingURL=data-source.js.map