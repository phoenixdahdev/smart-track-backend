import { MigrationInterface, QueryRunner } from "typeorm";

export class Phase10GuardianPortal1773732928809 implements MigrationInterface {
    name = 'Phase10GuardianPortal1773732928809'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."guardian_individuals_relationship_enum" AS ENUM('PARENT', 'LEGAL_GUARDIAN', 'FAMILY_MEMBER', 'AUTHORIZED_REPRESENTATIVE')`);
        await queryRunner.query(`CREATE TABLE "guardian_individuals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "guardian_id" uuid NOT NULL, "individual_id" uuid NOT NULL, "relationship" "public"."guardian_individuals_relationship_enum" NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_1e9171cbe58c4340c3fd319cbc2" UNIQUE ("guardian_id", "individual_id"), CONSTRAINT "PK_895df93dc130bf5fde24fe6cd0a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5f041f24a475a5a92a05abc808" ON "guardian_individuals" ("individual_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ee521ac5eb56c475ffff4ccebb" ON "guardian_individuals" ("guardian_id") `);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('AUTH_THRESHOLD', 'CLAIM_STATUS', 'REVIEW_REMINDER', 'SHIFT_UPDATE', 'ONBOARDING_STATUS', 'BREAK_GLASS', 'EVV_ALERT', 'GUARDIAN_UPDATE', 'SYSTEM')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "guardian_individuals" ADD CONSTRAINT "FK_ee521ac5eb56c475ffff4ccebbc" FOREIGN KEY ("guardian_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "guardian_individuals" ADD CONSTRAINT "FK_5f041f24a475a5a92a05abc8086" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "guardian_individuals" DROP CONSTRAINT "FK_5f041f24a475a5a92a05abc8086"`);
        await queryRunner.query(`ALTER TABLE "guardian_individuals" DROP CONSTRAINT "FK_ee521ac5eb56c475ffff4ccebbc"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('AUTH_THRESHOLD', 'CLAIM_STATUS', 'REVIEW_REMINDER', 'SHIFT_UPDATE', 'ONBOARDING_STATUS', 'BREAK_GLASS', 'EVV_ALERT', 'SYSTEM')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ee521ac5eb56c475ffff4ccebb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5f041f24a475a5a92a05abc808"`);
        await queryRunner.query(`DROP TABLE "guardian_individuals"`);
        await queryRunner.query(`DROP TYPE "public"."guardian_individuals_relationship_enum"`);
    }

}
