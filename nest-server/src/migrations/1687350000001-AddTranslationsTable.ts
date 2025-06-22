import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class AddTranslationsTable1687350000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
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

        await queryRunner.createForeignKey("translations", new TableForeignKey({
            columnNames: ["mediaId"],
            referencedColumnNames: ["id"],
            referencedTableName: "media",
            onDelete: "CASCADE"
        }));

        // 添加唯一约束，确保每个媒体的每个字段在每种语言下只有一个翻译
        await queryRunner.query(
            `ALTER TABLE translations ADD CONSTRAINT UQ_MEDIA_LANG_FIELD UNIQUE (mediaId, language, field)`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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