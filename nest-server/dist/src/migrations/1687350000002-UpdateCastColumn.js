"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCastColumn1687350000002 = void 0;
class UpdateCastColumn1687350000002 {
    constructor() {
        this.name = 'UpdateCastColumn1687350000002';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`media\` DROP COLUMN \`cast\``);
        await queryRunner.query(`ALTER TABLE \`media\` ADD \`cast\` json NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`media\` DROP COLUMN \`cast\``);
        await queryRunner.query(`ALTER TABLE \`media\` ADD \`cast\` text NOT NULL`);
    }
}
exports.UpdateCastColumn1687350000002 = UpdateCastColumn1687350000002;
//# sourceMappingURL=1687350000002-UpdateCastColumn.js.map