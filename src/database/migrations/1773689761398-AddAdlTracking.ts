import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdlTracking1773689761398 implements MigrationInterface {
    name = 'AddAdlTracking1773689761398'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "individual_payer_coverages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "individual_id" uuid NOT NULL, "payer_config_id" uuid NOT NULL, "subscriber_id" character varying(50) NOT NULL, "member_id" character varying(50), "group_number" character varying(50), "relationship" character varying(20) NOT NULL DEFAULT 'SELF', "coverage_start" date NOT NULL, "coverage_end" date, "priority" integer NOT NULL DEFAULT '1', "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_5f7c745c856663d389a0f470958" UNIQUE ("org_id", "individual_id", "payer_config_id", "coverage_start"), CONSTRAINT "PK_50249101620ba3faec3b741a8f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e214d44fcb6a61008f421c4e95" ON "individual_payer_coverages" ("individual_id") `);
        await queryRunner.query(`CREATE TYPE "public"."claim_status_history_from_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'ACCEPTED_277', 'REJECTED_277', 'PENDING', 'PAID', 'DENIED', 'PARTIAL_PAYMENT', 'ADJUSTED', 'VOID', 'APPEALED')`);
        await queryRunner.query(`CREATE TYPE "public"."claim_status_history_to_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'ACCEPTED_277', 'REJECTED_277', 'PENDING', 'PAID', 'DENIED', 'PARTIAL_PAYMENT', 'ADJUSTED', 'VOID', 'APPEALED')`);
        await queryRunner.query(`CREATE TABLE "claim_status_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "claim_id" uuid NOT NULL, "from_status" "public"."claim_status_history_from_status_enum", "to_status" "public"."claim_status_history_to_status_enum" NOT NULL, "changed_by" uuid, "reason" text, "details" jsonb, CONSTRAINT "PK_65b019b6e804e5f3f201353b19d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_45926a4ecbc253ec32ef949389" ON "claim_status_history" ("claim_id") `);
        await queryRunner.query(`CREATE TABLE "adl_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "description" character varying(500), "category_type" character varying(10) NOT NULL, "display_order" integer NOT NULL DEFAULT '0', "is_standard" boolean NOT NULL DEFAULT false, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_5503dac61446262d1e71b6dada9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_adl_categories_org_id" ON "adl_categories" ("org_id") `);
        await queryRunner.query(`CREATE TYPE "public"."adl_entries_assistance_level_enum" AS ENUM('INDEPENDENT', 'SUPERVISED', 'VERBAL_PROMPT', 'PHYSICAL_ASSIST', 'FULL_ASSIST', 'NOT_APPLICABLE')`);
        await queryRunner.query(`CREATE TABLE "adl_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "service_record_id" uuid NOT NULL, "individual_id" uuid NOT NULL, "staff_id" uuid NOT NULL, "adl_category_id" uuid NOT NULL, "assistance_level" "public"."adl_entries_assistance_level_enum" NOT NULL, "notes" text, "recorded_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2f0a2cc3dd7a5a57298349769be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_adl_entries_individual_id" ON "adl_entries" ("individual_id") `);
        await queryRunner.query(`CREATE INDEX "idx_adl_entries_service_record_id" ON "adl_entries" ("service_record_id") `);
        await queryRunner.query(`ALTER TABLE "programs" ADD "billing_type" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "taxonomy_code" character varying(10)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "mfa_secret" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "mfa_otp_code" character varying(6)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "mfa_otp_expires_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "mfa_backup_codes" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "mfa_failed_attempts" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "mfa_locked_until" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "claims" ADD "service_authorization_id" uuid`);
        await queryRunner.query(`ALTER TABLE "claims" ADD "created_by" uuid`);
        await queryRunner.query(`ALTER TABLE "claims" ADD "validation_errors" jsonb`);
        await queryRunner.query(`ALTER TABLE "claims" ADD "last_validated_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "claims" ADD "paid_amount_cents" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "claims" ADD "patient_responsibility_cents" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "claims" ADD "contractual_adj_cents" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "claims" ADD "balance_cents" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "claims" ADD "payer_claim_control_number" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "claims" ADD "denial_reason_codes" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TYPE "public"."users_mfa_type_enum" RENAME TO "users_mfa_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_mfa_type_enum" AS ENUM('TOTP', 'EMAIL_OTP', 'FIDO2', 'NONE')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "mfa_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "mfa_type" TYPE "public"."users_mfa_type_enum" USING "mfa_type"::"text"::"public"."users_mfa_type_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "mfa_type" SET DEFAULT 'NONE'`);
        await queryRunner.query(`DROP TYPE "public"."users_mfa_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."smarttrack_operators_mfa_type_enum" RENAME TO "smarttrack_operators_mfa_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."smarttrack_operators_mfa_type_enum" AS ENUM('TOTP', 'EMAIL_OTP', 'FIDO2', 'NONE')`);
        await queryRunner.query(`ALTER TABLE "smarttrack_operators" ALTER COLUMN "mfa_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "smarttrack_operators" ALTER COLUMN "mfa_type" TYPE "public"."smarttrack_operators_mfa_type_enum" USING "mfa_type"::"text"::"public"."smarttrack_operators_mfa_type_enum"`);
        await queryRunner.query(`ALTER TABLE "smarttrack_operators" ALTER COLUMN "mfa_type" SET DEFAULT 'NONE'`);
        await queryRunner.query(`DROP TYPE "public"."smarttrack_operators_mfa_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "claims" ADD CONSTRAINT "FK_97b3c6aa8af9cefe96a82c047cc" FOREIGN KEY ("service_authorization_id") REFERENCES "service_authorizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "claims" ADD CONSTRAINT "FK_fb434a169d6b39ea6eac4ac3d55" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "individual_payer_coverages" ADD CONSTRAINT "FK_e214d44fcb6a61008f421c4e957" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "individual_payer_coverages" ADD CONSTRAINT "FK_c7d103437ed9e42914bebe253e4" FOREIGN KEY ("payer_config_id") REFERENCES "payer_config"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "claim_status_history" ADD CONSTRAINT "FK_45926a4ecbc253ec32ef9493895" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "claim_status_history" ADD CONSTRAINT "FK_35a2071180de088166c0a1f4d51" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adl_entries" ADD CONSTRAINT "FK_578f1af128a24376aedfefc467a" FOREIGN KEY ("service_record_id") REFERENCES "service_records"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adl_entries" ADD CONSTRAINT "FK_09283e6b5b96714221b5d96bffb" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adl_entries" ADD CONSTRAINT "FK_aadc8b7d4a241b4bad74a1f978f" FOREIGN KEY ("staff_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adl_entries" ADD CONSTRAINT "FK_124711616f95f0f82a59e039bfe" FOREIGN KEY ("adl_category_id") REFERENCES "adl_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "adl_entries" DROP CONSTRAINT "FK_124711616f95f0f82a59e039bfe"`);
        await queryRunner.query(`ALTER TABLE "adl_entries" DROP CONSTRAINT "FK_aadc8b7d4a241b4bad74a1f978f"`);
        await queryRunner.query(`ALTER TABLE "adl_entries" DROP CONSTRAINT "FK_09283e6b5b96714221b5d96bffb"`);
        await queryRunner.query(`ALTER TABLE "adl_entries" DROP CONSTRAINT "FK_578f1af128a24376aedfefc467a"`);
        await queryRunner.query(`ALTER TABLE "claim_status_history" DROP CONSTRAINT "FK_35a2071180de088166c0a1f4d51"`);
        await queryRunner.query(`ALTER TABLE "claim_status_history" DROP CONSTRAINT "FK_45926a4ecbc253ec32ef9493895"`);
        await queryRunner.query(`ALTER TABLE "individual_payer_coverages" DROP CONSTRAINT "FK_c7d103437ed9e42914bebe253e4"`);
        await queryRunner.query(`ALTER TABLE "individual_payer_coverages" DROP CONSTRAINT "FK_e214d44fcb6a61008f421c4e957"`);
        await queryRunner.query(`ALTER TABLE "claims" DROP CONSTRAINT "FK_fb434a169d6b39ea6eac4ac3d55"`);
        await queryRunner.query(`ALTER TABLE "claims" DROP CONSTRAINT "FK_97b3c6aa8af9cefe96a82c047cc"`);
        await queryRunner.query(`CREATE TYPE "public"."smarttrack_operators_mfa_type_enum_old" AS ENUM('TOTP', 'FIDO2', 'NONE')`);
        await queryRunner.query(`ALTER TABLE "smarttrack_operators" ALTER COLUMN "mfa_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "smarttrack_operators" ALTER COLUMN "mfa_type" TYPE "public"."smarttrack_operators_mfa_type_enum_old" USING "mfa_type"::"text"::"public"."smarttrack_operators_mfa_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "smarttrack_operators" ALTER COLUMN "mfa_type" SET DEFAULT 'NONE'`);
        await queryRunner.query(`DROP TYPE "public"."smarttrack_operators_mfa_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."smarttrack_operators_mfa_type_enum_old" RENAME TO "smarttrack_operators_mfa_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."users_mfa_type_enum_old" AS ENUM('TOTP', 'FIDO2', 'NONE')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "mfa_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "mfa_type" TYPE "public"."users_mfa_type_enum_old" USING "mfa_type"::"text"::"public"."users_mfa_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "mfa_type" SET DEFAULT 'NONE'`);
        await queryRunner.query(`DROP TYPE "public"."users_mfa_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_mfa_type_enum_old" RENAME TO "users_mfa_type_enum"`);
        await queryRunner.query(`ALTER TABLE "claims" DROP COLUMN "denial_reason_codes"`);
        await queryRunner.query(`ALTER TABLE "claims" DROP COLUMN "payer_claim_control_number"`);
        await queryRunner.query(`ALTER TABLE "claims" DROP COLUMN "balance_cents"`);
        await queryRunner.query(`ALTER TABLE "claims" DROP COLUMN "contractual_adj_cents"`);
        await queryRunner.query(`ALTER TABLE "claims" DROP COLUMN "patient_responsibility_cents"`);
        await queryRunner.query(`ALTER TABLE "claims" DROP COLUMN "paid_amount_cents"`);
        await queryRunner.query(`ALTER TABLE "claims" DROP COLUMN "last_validated_at"`);
        await queryRunner.query(`ALTER TABLE "claims" DROP COLUMN "validation_errors"`);
        await queryRunner.query(`ALTER TABLE "claims" DROP COLUMN "created_by"`);
        await queryRunner.query(`ALTER TABLE "claims" DROP COLUMN "service_authorization_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mfa_locked_until"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mfa_failed_attempts"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mfa_backup_codes"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mfa_otp_expires_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mfa_otp_code"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mfa_secret"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "taxonomy_code"`);
        await queryRunner.query(`ALTER TABLE "programs" DROP COLUMN "billing_type"`);
        await queryRunner.query(`DROP INDEX "public"."idx_adl_entries_service_record_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_adl_entries_individual_id"`);
        await queryRunner.query(`DROP TABLE "adl_entries"`);
        await queryRunner.query(`DROP TYPE "public"."adl_entries_assistance_level_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_adl_categories_org_id"`);
        await queryRunner.query(`DROP TABLE "adl_categories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_45926a4ecbc253ec32ef949389"`);
        await queryRunner.query(`DROP TABLE "claim_status_history"`);
        await queryRunner.query(`DROP TYPE "public"."claim_status_history_to_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."claim_status_history_from_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e214d44fcb6a61008f421c4e95"`);
        await queryRunner.query(`DROP TABLE "individual_payer_coverages"`);
    }

}
