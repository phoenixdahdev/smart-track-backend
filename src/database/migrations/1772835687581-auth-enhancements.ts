import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthEnhancements1772835687581 implements MigrationInterface {
    name = 'AuthEnhancements1772835687581'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_users_auth0_sub"`);
        await queryRunner.query(`DROP INDEX "public"."idx_users_email"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_6d4919bbde4f4f1e2a132f9317d"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "auth0_sub"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "otp_code" character varying(6)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "otp_expires_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "reset_token" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "reset_token_expires_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_0a13270cd3101fd16b8000e00d4"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "org_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'DSP'`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_users_email" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_0a13270cd3101fd16b8000e00d4" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_0a13270cd3101fd16b8000e00d4"`);
        await queryRunner.query(`DROP INDEX "public"."idx_users_email"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'PENDING_INVITE'`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "org_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_0a13270cd3101fd16b8000e00d4" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "reset_token_expires_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "reset_token"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "otp_expires_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "otp_code"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verified"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "auth0_sub" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_6d4919bbde4f4f1e2a132f9317d" UNIQUE ("auth0_sub")`);
        await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users" ("email") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_users_auth0_sub" ON "users" ("auth0_sub") `);
    }

}
