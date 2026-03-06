import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserPassword1772832668044 implements MigrationInterface {
    name = 'AddUserPassword1772832668044'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "password" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password"`);
    }

}
