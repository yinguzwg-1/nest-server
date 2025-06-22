"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTranslationsTable1687350000001 = void 0;
const typeorm_1 = require("typeorm");
class AddTranslationsTable1687350000001 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: "translations",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "mediaId",
                    type: "int",
                },
                {
                    name: "field",
                    type: "enum",
                    enum: ["title", "description"]
                },
                {
                    name: "language",
                    type: "varchar",
                    length: "2"
                },
                {
                    name: "value",
                    type: "text"
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP",
                    onUpdate: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);
        await queryRunner.createForeignKey("translations", new typeorm_1.TableForeignKey({
            columnNames: ["mediaId"],
            referencedColumnNames: ["id"],
            referencedTableName: "media",
            onDelete: "CASCADE"
        }));
        await queryRunner.query(`ALTER TABLE translations ADD CONSTRAINT UQ_MEDIA_LANG_FIELD UNIQUE (mediaId, language, field)`);
    }
    async down(queryRunner) {
        const table = await queryRunner.getTable("translations");
        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("mediaId") !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey("translations", foreignKey);
            }
            await queryRunner.dropTable("translations");
        }
    }
}
exports.AddTranslationsTable1687350000001 = AddTranslationsTable1687350000001;
//# sourceMappingURL=1687350000001-AddTranslationsTable.js.map