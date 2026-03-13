import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEvvCorrectionIndividualId1773393877790 implements MigrationInterface {
    name = 'AddEvvCorrectionIndividualId1773393877790'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "evv_corrections" ADD "individual_id" uuid`);
        await queryRunner.query(`ALTER TABLE "evv_corrections" ADD CONSTRAINT "FK_b2a6baa34aaa0ce9156816e5e5a" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "evv_corrections" DROP CONSTRAINT "FK_b2a6baa34aaa0ce9156816e5e5a"`);
        await queryRunner.query(`ALTER TABLE "evv_corrections" DROP COLUMN "individual_id"`);
    }

}
