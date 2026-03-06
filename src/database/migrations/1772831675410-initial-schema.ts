import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1772831675410 implements MigrationInterface {
  name = 'InitialSchema1772831675410';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "program_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "address_line1" character varying(255) NOT NULL, "address_line2" character varying(255), "city" character varying(100) NOT NULL, "state" character varying(2) NOT NULL, "zip" character varying(10) NOT NULL, "latitude" numeric(10,7), "longitude" numeric(10,7), "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_4f5eccb1dfde10c9170502595a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sites_program_id" ON "sites" ("program_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "individuals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "first_name" text NOT NULL, "last_name" text NOT NULL, "ssn" text, "date_of_birth" text NOT NULL, "medicaid_id" text, "diagnosis_codes" text, "address" text, "phone" text, "emergency_contact" text, "guardian_id" uuid, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_ebf809180acc8fce381144eb48b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "staff_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "staff_id" uuid NOT NULL, "individual_id" uuid NOT NULL, "program_id" uuid NOT NULL, "effective_date" date NOT NULL, "end_date" date, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_ab013446523a48ceb9b14144530" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "programs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "type" character varying(100), "description" text, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_d43c664bcaafc0e8a06dfd34e05" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_status_enum" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "legal_name" character varying(255) NOT NULL, "dba" character varying(255), "npi" character varying(10) NOT NULL, "ein" character varying(10) NOT NULL, "status" "public"."organizations_status_enum" NOT NULL DEFAULT 'PENDING', "plan_tier" character varying(50), "schema_name" character varying(100), "address_line1" character varying(255), "address_line2" character varying(255), "city" character varying(100), "state" character varying(2), "zip" character varying(10), "phone" character varying(20), "go_live_date" date, "terminated_at" TIMESTAMP, CONSTRAINT "UQ_43c966554c19dcc542332c77678" UNIQUE ("npi"), CONSTRAINT "UQ_7136f125a3839f583cd8657a5ea" UNIQUE ("schema_name"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_organizations_status" ON "organizations" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_organizations_ein" ON "organizations" ("ein") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_organizations_npi" ON "organizations" ("npi") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'SUPERVISOR', 'DSP', 'CLINICIAN', 'BILLING_SPECIALIST', 'FINANCE_MANAGER', 'GUARDIAN', 'AGENCY_OWNER', 'SCHEDULER', 'HR_MANAGER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('PENDING_INVITE', 'ACTIVE', 'SUSPENDED', 'ARCHIVED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_mfa_type_enum" AS ENUM('TOTP', 'FIDO2', 'NONE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "email" character varying(255) NOT NULL, "name" character varying(255) NOT NULL, "phone" character varying(20), "role" "public"."users_role_enum" NOT NULL, "sub_permissions" jsonb NOT NULL DEFAULT '{}', "status" "public"."users_status_enum" NOT NULL DEFAULT 'PENDING_INVITE', "mfa_enabled" boolean NOT NULL DEFAULT false, "mfa_type" "public"."users_mfa_type_enum" NOT NULL DEFAULT 'NONE', "auth0_sub" character varying(255), "session_timeout" integer NOT NULL DEFAULT '30', "last_login" TIMESTAMP, "license_info" character varying(255), "certifications" jsonb NOT NULL DEFAULT '[]', "supervisor_id" uuid, CONSTRAINT "UQ_6d4919bbde4f4f1e2a132f9317d" UNIQUE ("auth0_sub"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_users_auth0_sub" ON "users" ("auth0_sub") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_status" ON "users" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_role" ON "users" ("role") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_email" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'SUSPENDED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_billing_cycle_enum" AS ENUM('MONTHLY', 'ANNUAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "plan_tier" character varying(50) NOT NULL, "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'TRIALING', "billing_cycle" "public"."subscriptions_billing_cycle_enum" NOT NULL DEFAULT 'MONTHLY', "mrr_cents" integer NOT NULL DEFAULT '0', "trial_ends_at" TIMESTAMP, "next_invoice_date" date, "stripe_subscription_id" character varying(255), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6ccf973355b70645eff37774de" ON "subscriptions" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_363623aab86786a0b99e10b03f" ON "subscriptions" ("org_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."smarttrack_operators_role_enum" AS ENUM('PLATFORM_OWNER', 'PLATFORM_ADMIN', 'ONBOARDING_SPECIALIST', 'SUPPORT_ENGINEER', 'BILLING_OPERATOR', 'COMPLIANCE_AUDITOR')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."smarttrack_operators_mfa_type_enum" AS ENUM('TOTP', 'FIDO2', 'NONE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "smarttrack_operators" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying(255) NOT NULL, "name" character varying(255) NOT NULL, "role" "public"."smarttrack_operators_role_enum" NOT NULL, "mfa_type" "public"."smarttrack_operators_mfa_type_enum" NOT NULL DEFAULT 'NONE', "mfa_device_id" character varying(255), "active" boolean NOT NULL DEFAULT true, "last_login" TIMESTAMP, CONSTRAINT "UQ_230569d895cc745662cbf3d171b" UNIQUE ("email"), CONSTRAINT "PK_8821c0a1b25c417d7c5475ace14" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3205edd1545c32cce610fcaba2" ON "smarttrack_operators" ("role") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."signup_applications_status_enum" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'DOCS_REQUESTED', 'DOCS_RECEIVED', 'APPROVED', 'PROVISIONING', 'ONBOARDING', 'ACTIVE', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "signup_applications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_name" character varying(255) NOT NULL, "npi" character varying(10) NOT NULL, "ein" character varying(10) NOT NULL, "contact_name" character varying(255) NOT NULL, "contact_email" character varying(255) NOT NULL, "contact_phone" character varying(20), "status" "public"."signup_applications_status_enum" NOT NULL DEFAULT 'SUBMITTED', "plan_tier" character varying(50), "risk_score" integer, "reviewed_by" uuid, "decision_at" TIMESTAMP, "rejection_reason" text, "submitted_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_8a59a4bf049eb9d86489e36741f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e8f56e9a9c2c6e487e45bebdb5" ON "signup_applications" ("submitted_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cfce2bf26530cfa8aabe48f524" ON "signup_applications" ("npi") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_43f9a2f6db8a71c6563525e1ec" ON "signup_applications" ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."signed_agreements_agreement_type_enum" AS ENUM('BAA', 'SERVICE_AGREEMENT', 'NDA')`,
    );
    await queryRunner.query(
      `CREATE TABLE "signed_agreements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "agreement_type" "public"."signed_agreements_agreement_type_enum" NOT NULL, "version" character varying(20) NOT NULL, "signed_by_name" character varying(255) NOT NULL, "signed_at" TIMESTAMP NOT NULL, "ip_address" character varying(45) NOT NULL, "pdf_s3_key" character varying(500) NOT NULL, "pdf_s3_bucket" character varying(255) NOT NULL, CONSTRAINT "PK_4eb7430048396059edc49988e0e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."shifts_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'ACCEPTED', 'REJECTED', 'NO_RESPONSE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "shifts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "staff_id" uuid NOT NULL, "individual_id" uuid NOT NULL, "site_id" uuid, "program_id" uuid, "shift_date" date NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "status" "public"."shifts_status_enum" NOT NULL DEFAULT 'DRAFT', "created_by" uuid NOT NULL, "published_at" TIMESTAMP, "responded_at" TIMESTAMP, CONSTRAINT "PK_84d692e367e4d6cdf045828768c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3e044af0f8d48f964102ee2bf6" ON "shifts" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7773186c6722dc2ec0840acdb0" ON "shifts" ("shift_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5d750ec7e9b1c0c4f4edb89621" ON "shifts" ("staff_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."service_records_status_enum" AS ENUM('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "service_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "individual_id" uuid NOT NULL, "staff_id" uuid NOT NULL, "program_id" uuid, "service_date" date NOT NULL, "service_code_id" uuid, "units_delivered" numeric(10,2) NOT NULL, "status" "public"."service_records_status_enum" NOT NULL DEFAULT 'DRAFT', "submitted_at" TIMESTAMP, "approved_by" uuid, "approved_at" TIMESTAMP, "rejected_by" uuid, "rejection_reason" text, "evv_punch_in_id" uuid, "evv_punch_out_id" uuid, CONSTRAINT "PK_eb60ec90c5548e73a5211c48ab9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3e2ed5436304afbbbeed6adc07" ON "service_records" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_78b594193435542f5ecc1d2919" ON "service_records" ("service_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3677c3ca5843dc808d2759808b" ON "service_records" ("staff_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1de4ab82b441a423363c75977a" ON "service_records" ("individual_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "global_service_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "code" character varying(20) NOT NULL, "description" text NOT NULL, "code_type" character varying(20) NOT NULL, "valid_states" jsonb NOT NULL DEFAULT '[]', "billing_unit" character varying(20) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'ACTIVE', "deprecated_at" TIMESTAMP, "created_by" uuid, CONSTRAINT "UQ_6597566f935a95e7b3a061a0f1f" UNIQUE ("code"), CONSTRAINT "PK_2f33b4b20561dbad0e358ebe9a9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_43a96d11e63482c95afe83f1b3" ON "global_service_codes" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_00fcfe565f842f2a4d8df06a4a" ON "global_service_codes" ("code_type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "service_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "global_code_id" uuid NOT NULL, "code" character varying(20) NOT NULL, "description" text, "modifiers" jsonb NOT NULL DEFAULT '[]', "unit_of_measure" character varying(20) NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_0deb277bb2ab71cea5fc13f364a" UNIQUE ("org_id", "code"), CONSTRAINT "PK_234a2e2343d0b851e71f3bb2569" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "global_payers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "payer_name" character varying(255) NOT NULL, "payer_id_edi" character varying(50) NOT NULL, "state" character varying(2), "program_type" character varying(50), "clearinghouse_id" character varying(100), "active" boolean NOT NULL DEFAULT true, "config" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_bb6520f5a91353b238fff8d4963" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6080d82bb4a188ca2674d25d50" ON "global_payers" ("active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_035ae5d6f6e3f4bed1d76434ab" ON "global_payers" ("state") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c857e3228f67312c42c2b1c882" ON "global_payers" ("payer_id_edi") `,
    );
    await queryRunner.query(
      `CREATE TABLE "payer_config" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "global_payer_id" uuid NOT NULL, "payer_name" character varying(255) NOT NULL, "payer_id_edi" character varying(50) NOT NULL, "clearinghouse_routing" jsonb NOT NULL DEFAULT '{}', "active" boolean NOT NULL DEFAULT true, "config" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "UQ_da9491c6311eb5be1562bc6a1f4" UNIQUE ("org_id", "payer_id_edi"), CONSTRAINT "PK_eeed3f399a9ff81bc6773b93021" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."service_authorizations_unit_type_enum" AS ENUM('HOUR', 'DAY', 'VISIT', 'DOLLAR')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."service_authorizations_status_enum" AS ENUM('ACTIVE', 'EXHAUSTED', 'EXPIRED', 'VOIDED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "service_authorizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "individual_id" uuid NOT NULL, "payer_config_id" uuid NOT NULL, "service_code_id" uuid NOT NULL, "auth_number" character varying(50) NOT NULL, "units_authorized" numeric(10,2) NOT NULL, "units_used" numeric(10,2) NOT NULL DEFAULT '0', "units_pending" numeric(10,2) NOT NULL DEFAULT '0', "unit_type" "public"."service_authorizations_unit_type_enum" NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "rendering_provider_npi" character varying(10), "status" "public"."service_authorizations_status_enum" NOT NULL DEFAULT 'ACTIVE', "notes" text, "created_by" uuid, CONSTRAINT "PK_7e0733f80baaa01a23725726865" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8e8565686a691288758e4c3949" ON "service_authorizations" ("end_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_09069ed4795040c05965e27fb1" ON "service_authorizations" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70403e883b776021b44ed110e2" ON "service_authorizations" ("individual_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."remittances_status_enum" AS ENUM('RECEIVED', 'FULLY_POSTED', 'PARTIAL', 'UNMATCHED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "remittances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "payer_config_id" uuid NOT NULL, "payment_date" date NOT NULL, "eft_trace_number" character varying(30) NOT NULL, "eft_total_cents" bigint NOT NULL, "interchange_control_num" character varying(50), "status" "public"."remittances_status_enum" NOT NULL DEFAULT 'RECEIVED', "raw_file_s3_key" character varying(500), "received_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "UQ_16cfd9fb061a1059bebd6bc7bfe" UNIQUE ("org_id", "interchange_control_num"), CONSTRAINT "PK_8fb70e358321fa66e0674380740" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1b8c067136ebcf90532c560c45" ON "remittances" ("eft_trace_number") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a0a5e77f570a7c18e0ca1fae4" ON "remittances" ("payment_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9f5f376866b084c4ebd68e0a52" ON "remittances" ("payer_config_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "rate_tables" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "payer_config_id" uuid NOT NULL, "service_code_id" uuid NOT NULL, "rate_cents" integer NOT NULL, "effective_date" date NOT NULL, "end_date" date, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_64de8da271e4cb6ec18fc7d0161" UNIQUE ("payer_config_id", "service_code_id", "effective_date"), CONSTRAINT "PK_817555c4d3ed729e9775313f378" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "platform_audit_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "operator_id" uuid NOT NULL, "operator_role" character varying(50) NOT NULL, "action" character varying(100) NOT NULL, "target_type" character varying(100), "target_id" uuid, "before_val" jsonb, "after_val" jsonb, "ip_address" character varying(45) NOT NULL, "user_agent" text, CONSTRAINT "PK_ad4338eabd3fc4e3e72c03555f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_88e37c6fc0b0731268739f8721" ON "platform_audit_log" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5669b44b2d48e6463ba0d599ca" ON "platform_audit_log" ("action") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d0a04189184d90b64cbd3b3754" ON "platform_audit_log" ("operator_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "plan_definitions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "tier_name" character varying(50) NOT NULL, "max_individuals" integer NOT NULL, "max_users" integer NOT NULL, "storage_gb" integer NOT NULL, "api_calls_monthly" integer NOT NULL, "modules_included" jsonb NOT NULL DEFAULT '[]', "price_cents_monthly" integer NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_e1a7aa915fe1170f22c6572c0b8" UNIQUE ("tier_name"), CONSTRAINT "PK_d782695691e25ef94c39abc7b15" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."claims_claim_type_enum" AS ENUM('PROFESSIONAL_837P', 'INSTITUTIONAL_837I', 'ENCOUNTER_837P')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."claims_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'ACCEPTED_277', 'REJECTED_277', 'PENDING', 'PAID', 'DENIED', 'PARTIAL_PAYMENT', 'ADJUSTED', 'VOID', 'APPEALED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "claims" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "service_record_id" uuid NOT NULL, "individual_id" uuid NOT NULL, "payer_config_id" uuid NOT NULL, "claim_type" "public"."claims_claim_type_enum" NOT NULL, "subscriber_id" character varying(50) NOT NULL, "billing_provider_npi" character varying(10) NOT NULL, "billing_provider_ein" character varying(10) NOT NULL, "billing_provider_name" character varying(255) NOT NULL, "billing_provider_address" jsonb NOT NULL, "service_date_from" date NOT NULL, "service_date_through" date NOT NULL, "frequency_code" character varying(1) NOT NULL DEFAULT '1', "place_of_service" character varying(2) NOT NULL, "diagnosis_codes" jsonb NOT NULL DEFAULT '[]', "total_charge_cents" integer NOT NULL, "status" "public"."claims_status_enum" NOT NULL DEFAULT 'DRAFT', "original_claim_id" uuid, "submitted_at" TIMESTAMP, "paid_at" TIMESTAMP, CONSTRAINT "PK_96c91970c0dcb2f69fdccd0a698" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4cfb78f7f6a975213106a64a8f" ON "claims" ("service_date_from") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f46777b99d3cbf2260b0ee7f1" ON "claims" ("payer_config_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_78214f7ed47cfd76fb8bf6bb28" ON "claims" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_478a2b686380fae03e60be5868" ON "claims" ("service_record_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "claim_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "claim_id" uuid NOT NULL, "service_code_id" uuid NOT NULL, "procedure_code" character varying(20) NOT NULL, "modifiers" jsonb NOT NULL DEFAULT '[]', "service_date" date NOT NULL, "units_billed" numeric(10,2) NOT NULL, "charge_cents" integer NOT NULL, "rendering_provider_npi" character varying(10), "place_of_service" character varying(2) NOT NULL, "diagnosis_pointer" jsonb NOT NULL DEFAULT '[]', "line_number" integer NOT NULL, CONSTRAINT "PK_555f43896498b6c16a43935cea6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_posts_matching_method_enum" AS ENUM('CLAIM_ID', 'PAYER_CONTROL_NUM', 'SERVICE_DATE_MEMBER', 'MANUAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "remittance_id" uuid NOT NULL, "claim_id" uuid, "claim_line_id" uuid, "status_code" character varying(50), "billed_cents" bigint NOT NULL, "paid_cents" bigint NOT NULL, "patient_responsibility_cents" bigint NOT NULL DEFAULT '0', "payer_claim_control_number" character varying(50), "matching_confidence" numeric(3,2), "matching_method" "public"."payment_posts_matching_method_enum", CONSTRAINT "PK_1a8900a3855469877b38c062123" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "org_modules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "module_name" character varying(100) NOT NULL, "enabled" boolean NOT NULL DEFAULT false, "enabled_by" uuid, "enabled_at" TIMESTAMP, "disabled_by" uuid, "disabled_at" TIMESTAMP, CONSTRAINT "UQ_4c0505d80518ad49210947c0c5f" UNIQUE ("org_id", "module_name"), CONSTRAINT "PK_d6bf1fe9c3f4d15d960ef507c7f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "org_feature_flags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "flag_name" character varying(100) NOT NULL, "value" jsonb NOT NULL DEFAULT 'false', "set_by" uuid, "set_at" TIMESTAMP, "notes" text, CONSTRAINT "UQ_10415ef725cca9375d9726b518a" UNIQUE ("org_id", "flag_name"), CONSTRAINT "PK_34ed526273722d770d32ad187a2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "org_contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "contact_type" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(20), "is_signatory" boolean NOT NULL DEFAULT false, "is_primary_billing" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_b8455081b6b39c12d6033f74f9a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."onboarding_checklists_status_enum" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "onboarding_checklists" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "specialist_id" uuid, "status" "public"."onboarding_checklists_status_enum" NOT NULL DEFAULT 'NOT_STARTED', "completed_at" TIMESTAMP, CONSTRAINT "PK_a49c2a1d9f583923d2cab273023" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."onboarding_tasks_status_enum" AS ENUM('PENDING', 'COMPLETED', 'SKIPPED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "onboarding_tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "checklist_id" uuid NOT NULL, "task_key" character varying(100) NOT NULL, "task_name" character varying(255) NOT NULL, "status" "public"."onboarding_tasks_status_enum" NOT NULL DEFAULT 'PENDING', "completed_by" uuid, "completed_at" TIMESTAMP, "notes" text, CONSTRAINT "PK_04ddbad3ed27e955e9edd674447" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('AUTH_THRESHOLD', 'CLAIM_STATUS', 'REVIEW_REMINDER', 'SHIFT_UPDATE', 'ONBOARDING_STATUS', 'BREAK_GLASS', 'EVV_ALERT', 'SYSTEM')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "user_id" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "entity_type" character varying(100), "entity_id" uuid, "title" character varying(255) NOT NULL, "message" text NOT NULL, "read" boolean NOT NULL DEFAULT false, "read_at" TIMESTAMP, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_77ee7b06d6f802000c0846f3a5" ON "notifications" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aef1c7aef3725068e5540f8f00" ON "notifications" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f8b7ed75170d2d7dca4477cc94" ON "notifications" ("read") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a8a82462cab47c73d25f49261" ON "notifications" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "notification_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "user_id" uuid NOT NULL, "email_enabled" boolean NOT NULL DEFAULT true, "sms_enabled" boolean NOT NULL DEFAULT false, "in_app_enabled" boolean NOT NULL DEFAULT true, "preferences" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_e94e2b543f2f218ee68e4f4fad2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "mar_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "individual_id" uuid NOT NULL, "administered_by" uuid NOT NULL, "drug_name" text NOT NULL, "dose" text NOT NULL, "route" text, "scheduled_time" TIMESTAMP NOT NULL, "administered_time" TIMESTAMP, "result" character varying(50) NOT NULL, "notes" text, CONSTRAINT "PK_a41d06e0bf7653df48c244c9e46" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "isp_goals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "individual_id" uuid NOT NULL, "description" text NOT NULL, "target" character varying(255), "effective_start" date NOT NULL, "effective_end" date, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_00a03e8b3b2d2ef011284cc9be0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "isp_data_points" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "goal_id" uuid NOT NULL, "service_record_id" uuid, "value" character varying(255) NOT NULL, "recorded_at" TIMESTAMP NOT NULL, "recorded_by" uuid NOT NULL, CONSTRAINT "PK_b081a07ec51ad7ffb336701ced2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_status_enum" AS ENUM('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'VOID')`,
    );
    await queryRunner.query(
      `CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "subscription_id" uuid NOT NULL, "amount_cents" integer NOT NULL, "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'DRAFT', "due_date" date NOT NULL, "paid_at" TIMESTAMP, "stripe_invoice_id" character varying(255), "pdf_s3_key" character varying(500), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0457ee681a50419881ea2ee796" ON "invoices" ("due_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ac0f09364e3701d9ed35435288" ON "invoices" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_824ca52f970e3ca5c8475ccee5" ON "invoices" ("org_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."incidents_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CLOSED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "incidents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "individual_id" uuid NOT NULL, "reported_by" uuid NOT NULL, "type" character varying(100) NOT NULL, "description" text NOT NULL, "immediate_action" text, "supervisor_comments" text, "status" "public"."incidents_status_enum" NOT NULL DEFAULT 'DRAFT', "occurred_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_ccb34c01719889017e2246469f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."evv_punches_punch_type_enum" AS ENUM('CLOCK_IN', 'CLOCK_OUT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "evv_punches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "staff_id" uuid NOT NULL, "individual_id" uuid NOT NULL, "shift_id" uuid, "punch_type" "public"."evv_punches_punch_type_enum" NOT NULL, "timestamp" TIMESTAMP NOT NULL, "gps_latitude" numeric(10,7), "gps_longitude" numeric(10,7), "location_confirmed" boolean NOT NULL DEFAULT false, "device_id" character varying(255), "notes" text, CONSTRAINT "PK_2af5a3a534ed28153b9ea0e15dc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_46067080dbd7815a261ce86b94" ON "evv_punches" ("punch_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_34ace3f4e9eea92f7009402e56" ON "evv_punches" ("timestamp") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b236af2f970e14b57134cdf813" ON "evv_punches" ("individual_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_914b6218eeb56c9f17e255e49c" ON "evv_punches" ("staff_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."evv_corrections_punch_type_enum" AS ENUM('CLOCK_IN', 'CLOCK_OUT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."evv_corrections_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "evv_corrections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "staff_id" uuid NOT NULL, "shift_id" uuid, "punch_type" "public"."evv_corrections_punch_type_enum" NOT NULL, "requested_time" TIMESTAMP NOT NULL, "reason" text NOT NULL, "status" "public"."evv_corrections_status_enum" NOT NULL DEFAULT 'PENDING', "reviewed_by" uuid, "reviewed_at" TIMESTAMP, CONSTRAINT "PK_adee66cf1de1f09cc6b863db44e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "daily_notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "service_record_id" uuid NOT NULL, "content" text NOT NULL, "observations" text, "submitted_at" TIMESTAMP, "approved_at" TIMESTAMP, CONSTRAINT "PK_20da0c697ccd5d7af52f013f0c1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."correction_requests_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "correction_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "service_record_id" uuid NOT NULL, "requested_by" uuid NOT NULL, "requested_changes" text NOT NULL, "status" "public"."correction_requests_status_enum" NOT NULL DEFAULT 'PENDING', "reviewed_by" uuid, "reviewed_at" TIMESTAMP, "reviewer_notes" text, CONSTRAINT "PK_b592348382860fed92400d5efc7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."claim_submissions_submission_type_enum" AS ENUM('PROFESSIONAL_837P', 'INSTITUTIONAL_837I', 'ENCOUNTER_837P')`,
    );
    await queryRunner.query(
      `CREATE TABLE "claim_submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "claim_id" uuid NOT NULL, "submission_type" "public"."claim_submissions_submission_type_enum" NOT NULL, "edi_content" text, "s3_key" character varying(500), "clearinghouse_id" character varying(100), "submitted_at" TIMESTAMP NOT NULL, "response_received_at" TIMESTAMP, "response_status" character varying(50), "response_details" jsonb, CONSTRAINT "PK_4c281a1d9782c08fea9a0178785" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "break_glass_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "operator_id" uuid NOT NULL, "org_id" uuid NOT NULL, "ticket_id" character varying(100) NOT NULL, "reason" text NOT NULL, "data_scope" character varying(50) NOT NULL, "approved_by" uuid, "approved_at" TIMESTAMP, "start_at" TIMESTAMP NOT NULL, "end_at" TIMESTAMP, "actions_summary" text, CONSTRAINT "PK_a418a811a6fb1cae94eaf345606" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "behavior_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "individual_id" uuid NOT NULL, "clinician_id" uuid NOT NULL, "version" integer NOT NULL DEFAULT '1', "content" text NOT NULL, "effective_date" date NOT NULL, "end_date" date, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_de808c3d6a916a86626e5171824" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "user_id" uuid NOT NULL, "user_role" character varying(50) NOT NULL, "action" character varying(100) NOT NULL, "action_type" character varying(50), "table_name" character varying(100), "record_id" uuid, "before_val" jsonb, "after_val" jsonb, "ip_address" character varying(45) NOT NULL, "user_agent" text, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_table_name" ON "audit_logs" ("table_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_action" ON "audit_logs" ("action") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "application_notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "application_id" uuid NOT NULL, "operator_id" uuid NOT NULL, "note_text" text NOT NULL, CONSTRAINT "PK_db708de5fa99541ad52a1f907de" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "application_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "application_id" uuid NOT NULL, "doc_type" character varying(50) NOT NULL, "s3_key" character varying(500) NOT NULL, "s3_bucket" character varying(255) NOT NULL, "verified" boolean NOT NULL DEFAULT false, "verified_by" uuid, "verified_at" TIMESTAMP, "notes" text, CONSTRAINT "PK_592142aa992e003beadf1409e9e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."adjustments_type_enum" AS ENUM('CONTRACTUAL', 'WRITE_OFF', 'PATIENT_RESPONSIBILITY', 'PAYER_REDUCTION', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "adjustments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "org_id" uuid NOT NULL, "claim_line_id" uuid NOT NULL, "payment_post_id" uuid, "type" "public"."adjustments_type_enum" NOT NULL, "reason_code" character varying(50) NOT NULL, "adjustment_amount_cents" bigint NOT NULL, CONSTRAINT "PK_9236bf670736e5ad5df36dd1eb4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "sites" ADD CONSTRAINT "FK_e02358e77afe83fc2a1db7b7ee1" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "individuals" ADD CONSTRAINT "FK_da6120db22c6a2e710de7eba3bd" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "individuals" ADD CONSTRAINT "FK_6caf4cd3749ac561d64a50eb468" FOREIGN KEY ("guardian_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff_assignments" ADD CONSTRAINT "FK_6ff0f6a29afcb34aa82e9963298" FOREIGN KEY ("staff_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff_assignments" ADD CONSTRAINT "FK_e4bccab71e5e4766e406d5184c5" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff_assignments" ADD CONSTRAINT "FK_012634550eefb596b16355bba66" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "programs" ADD CONSTRAINT "FK_1a1ac1fe8476545a8e08d860c3d" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_0a13270cd3101fd16b8000e00d4" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_9a1bf4d0601de6693fc9b31d7f5" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_363623aab86786a0b99e10b03fc" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "signup_applications" ADD CONSTRAINT "FK_dffd428ac1d233f50626e36be4f" FOREIGN KEY ("reviewed_by") REFERENCES "smarttrack_operators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "signed_agreements" ADD CONSTRAINT "FK_f9b06e33e0842147ec15562f19a" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shifts" ADD CONSTRAINT "FK_5d750ec7e9b1c0c4f4edb89621f" FOREIGN KEY ("staff_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shifts" ADD CONSTRAINT "FK_f4e71fdb4bc59e606ef75ead4db" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shifts" ADD CONSTRAINT "FK_a26b82c0848cfc320539640fa46" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shifts" ADD CONSTRAINT "FK_5a77b6a77621127db084c7a042b" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shifts" ADD CONSTRAINT "FK_ea75504762315a29ef084025672" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_records" ADD CONSTRAINT "FK_1de4ab82b441a423363c75977a6" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_records" ADD CONSTRAINT "FK_3677c3ca5843dc808d2759808b9" FOREIGN KEY ("staff_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_records" ADD CONSTRAINT "FK_02a094385fedff7045166e19776" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_records" ADD CONSTRAINT "FK_c8423a1c9d3828f7d5866e2ead3" FOREIGN KEY ("rejected_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_records" ADD CONSTRAINT "FK_39b68455bbb6b077aaa2a1d5c37" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_codes" ADD CONSTRAINT "FK_ed9f439195ddb72463388c287a5" FOREIGN KEY ("global_code_id") REFERENCES "global_service_codes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payer_config" ADD CONSTRAINT "FK_7f2e2c595f2a90f87da6e8c94e3" FOREIGN KEY ("global_payer_id") REFERENCES "global_payers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_authorizations" ADD CONSTRAINT "FK_70403e883b776021b44ed110e22" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_authorizations" ADD CONSTRAINT "FK_e378b61e0624bcf086c092df3d8" FOREIGN KEY ("payer_config_id") REFERENCES "payer_config"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_authorizations" ADD CONSTRAINT "FK_8b18a0ad830e54957da135e72d4" FOREIGN KEY ("service_code_id") REFERENCES "service_codes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_authorizations" ADD CONSTRAINT "FK_cd082e6acb3f4365420301f6c46" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "remittances" ADD CONSTRAINT "FK_9f5f376866b084c4ebd68e0a524" FOREIGN KEY ("payer_config_id") REFERENCES "payer_config"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rate_tables" ADD CONSTRAINT "FK_2a2b1aea4e1f38ab3bfc1bd42a4" FOREIGN KEY ("payer_config_id") REFERENCES "payer_config"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rate_tables" ADD CONSTRAINT "FK_278f19db4e5bfaf9e62ee2176ca" FOREIGN KEY ("service_code_id") REFERENCES "service_codes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "claims" ADD CONSTRAINT "FK_478a2b686380fae03e60be58682" FOREIGN KEY ("service_record_id") REFERENCES "service_records"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "claims" ADD CONSTRAINT "FK_9aa986c87f7eaf5c253ae359b8d" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "claims" ADD CONSTRAINT "FK_3f46777b99d3cbf2260b0ee7f12" FOREIGN KEY ("payer_config_id") REFERENCES "payer_config"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "claims" ADD CONSTRAINT "FK_d4f81e4980e2d48476dcc405d2d" FOREIGN KEY ("original_claim_id") REFERENCES "claims"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "claim_lines" ADD CONSTRAINT "FK_65c3a591eabdea55a86e4367789" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "claim_lines" ADD CONSTRAINT "FK_cd8759cb322f458c2ce2d0438b9" FOREIGN KEY ("service_code_id") REFERENCES "service_codes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_posts" ADD CONSTRAINT "FK_13477bd2dffa6863909edd43be8" FOREIGN KEY ("remittance_id") REFERENCES "remittances"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_posts" ADD CONSTRAINT "FK_0ddb858e722f74de3972c7aca0f" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_posts" ADD CONSTRAINT "FK_522525370f6451eb34a58205e08" FOREIGN KEY ("claim_line_id") REFERENCES "claim_lines"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_modules" ADD CONSTRAINT "FK_dc267a9c8e26a51302734708bed" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_feature_flags" ADD CONSTRAINT "FK_63e513c62c47dc7820593466e2c" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_contacts" ADD CONSTRAINT "FK_46e1c26ac317ba0a8de2808df03" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "onboarding_checklists" ADD CONSTRAINT "FK_e00a19d3398544900fe9fe19767" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "onboarding_checklists" ADD CONSTRAINT "FK_2f673095f4a2196d326f1d4480d" FOREIGN KEY ("specialist_id") REFERENCES "smarttrack_operators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "onboarding_tasks" ADD CONSTRAINT "FK_65769a05a5366ff167f1a1d5363" FOREIGN KEY ("checklist_id") REFERENCES "onboarding_checklists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_64c90edc7310c6be7c10c96f675" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mar_entries" ADD CONSTRAINT "FK_ac2448ef83468128eea6c1ed78f" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mar_entries" ADD CONSTRAINT "FK_5e023e4a6643d02e48ac6c14ee8" FOREIGN KEY ("administered_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "isp_goals" ADD CONSTRAINT "FK_f1d3288207f0fbb5c35b11c1118" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "isp_data_points" ADD CONSTRAINT "FK_86198247c6d4b3e38a983daf4b5" FOREIGN KEY ("goal_id") REFERENCES "isp_goals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "isp_data_points" ADD CONSTRAINT "FK_26b49cb93b92128ece348d26069" FOREIGN KEY ("service_record_id") REFERENCES "service_records"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "isp_data_points" ADD CONSTRAINT "FK_df4189a61bf191946416b5df5da" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_824ca52f970e3ca5c8475ccee59" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_5152c0aa0f851d9b95972b442e0" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" ADD CONSTRAINT "FK_209099e8fce664e078f1da3ec3e" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" ADD CONSTRAINT "FK_3ebe443aa45fa27fd71ed165e04" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evv_punches" ADD CONSTRAINT "FK_914b6218eeb56c9f17e255e49c7" FOREIGN KEY ("staff_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evv_punches" ADD CONSTRAINT "FK_b236af2f970e14b57134cdf8138" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evv_punches" ADD CONSTRAINT "FK_99710381b8a5d62b313bc5ada09" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evv_corrections" ADD CONSTRAINT "FK_297bb3b0e52a811cdd9330580ec" FOREIGN KEY ("staff_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evv_corrections" ADD CONSTRAINT "FK_30b1e2eda5fab4a6af8974e2146" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evv_corrections" ADD CONSTRAINT "FK_b521bd6691e7d80e48afc7e6f84" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_notes" ADD CONSTRAINT "FK_4f62aa4bb38fcbc1dee2895aa73" FOREIGN KEY ("service_record_id") REFERENCES "service_records"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "correction_requests" ADD CONSTRAINT "FK_90f98094cd24093a711ee0c1212" FOREIGN KEY ("service_record_id") REFERENCES "service_records"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "correction_requests" ADD CONSTRAINT "FK_7f628821d78d11f9d4993039227" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "correction_requests" ADD CONSTRAINT "FK_14e25e29d90376e70d4c45637a0" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "claim_submissions" ADD CONSTRAINT "FK_a4d55a23c67e0a98559ea9817b9" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "break_glass_sessions" ADD CONSTRAINT "FK_4552e0e2db79c9a8763ca2ba4e9" FOREIGN KEY ("operator_id") REFERENCES "smarttrack_operators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "break_glass_sessions" ADD CONSTRAINT "FK_4ead860f385e46c862deae788d2" FOREIGN KEY ("approved_by") REFERENCES "smarttrack_operators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "break_glass_sessions" ADD CONSTRAINT "FK_5736ccdd581d8c63d9d28ded414" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "behavior_plans" ADD CONSTRAINT "FK_bdb79247cf1b28fb833a426f174" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "behavior_plans" ADD CONSTRAINT "FK_2284ed06c8fc61ad28de7bd15a2" FOREIGN KEY ("clinician_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_notes" ADD CONSTRAINT "FK_1a5375c61bc031bba625c02096d" FOREIGN KEY ("application_id") REFERENCES "signup_applications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_notes" ADD CONSTRAINT "FK_7316d06b4fd46f0e1fb969aa4e6" FOREIGN KEY ("operator_id") REFERENCES "smarttrack_operators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_documents" ADD CONSTRAINT "FK_9ad8ab815e842d67e9aaec900cb" FOREIGN KEY ("application_id") REFERENCES "signup_applications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_documents" ADD CONSTRAINT "FK_20e284f47ea0325c93cfca00f45" FOREIGN KEY ("verified_by") REFERENCES "smarttrack_operators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "adjustments" ADD CONSTRAINT "FK_ba1f6475af3f88cd10e2f48d928" FOREIGN KEY ("claim_line_id") REFERENCES "claim_lines"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "adjustments" ADD CONSTRAINT "FK_3bc8c0f9f2e4c01c355e0ec3ef1" FOREIGN KEY ("payment_post_id") REFERENCES "payment_posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "adjustments" DROP CONSTRAINT "FK_3bc8c0f9f2e4c01c355e0ec3ef1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "adjustments" DROP CONSTRAINT "FK_ba1f6475af3f88cd10e2f48d928"`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_documents" DROP CONSTRAINT "FK_20e284f47ea0325c93cfca00f45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_documents" DROP CONSTRAINT "FK_9ad8ab815e842d67e9aaec900cb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_notes" DROP CONSTRAINT "FK_7316d06b4fd46f0e1fb969aa4e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "application_notes" DROP CONSTRAINT "FK_1a5375c61bc031bba625c02096d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "behavior_plans" DROP CONSTRAINT "FK_2284ed06c8fc61ad28de7bd15a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "behavior_plans" DROP CONSTRAINT "FK_bdb79247cf1b28fb833a426f174"`,
    );
    await queryRunner.query(
      `ALTER TABLE "break_glass_sessions" DROP CONSTRAINT "FK_5736ccdd581d8c63d9d28ded414"`,
    );
    await queryRunner.query(
      `ALTER TABLE "break_glass_sessions" DROP CONSTRAINT "FK_4ead860f385e46c862deae788d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "break_glass_sessions" DROP CONSTRAINT "FK_4552e0e2db79c9a8763ca2ba4e9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "claim_submissions" DROP CONSTRAINT "FK_a4d55a23c67e0a98559ea9817b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "correction_requests" DROP CONSTRAINT "FK_14e25e29d90376e70d4c45637a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "correction_requests" DROP CONSTRAINT "FK_7f628821d78d11f9d4993039227"`,
    );
    await queryRunner.query(
      `ALTER TABLE "correction_requests" DROP CONSTRAINT "FK_90f98094cd24093a711ee0c1212"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_notes" DROP CONSTRAINT "FK_4f62aa4bb38fcbc1dee2895aa73"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evv_corrections" DROP CONSTRAINT "FK_b521bd6691e7d80e48afc7e6f84"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evv_corrections" DROP CONSTRAINT "FK_30b1e2eda5fab4a6af8974e2146"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evv_corrections" DROP CONSTRAINT "FK_297bb3b0e52a811cdd9330580ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evv_punches" DROP CONSTRAINT "FK_99710381b8a5d62b313bc5ada09"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evv_punches" DROP CONSTRAINT "FK_b236af2f970e14b57134cdf8138"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evv_punches" DROP CONSTRAINT "FK_914b6218eeb56c9f17e255e49c7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" DROP CONSTRAINT "FK_3ebe443aa45fa27fd71ed165e04"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" DROP CONSTRAINT "FK_209099e8fce664e078f1da3ec3e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_5152c0aa0f851d9b95972b442e0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_824ca52f970e3ca5c8475ccee59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "isp_data_points" DROP CONSTRAINT "FK_df4189a61bf191946416b5df5da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "isp_data_points" DROP CONSTRAINT "FK_26b49cb93b92128ece348d26069"`,
    );
    await queryRunner.query(
      `ALTER TABLE "isp_data_points" DROP CONSTRAINT "FK_86198247c6d4b3e38a983daf4b5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "isp_goals" DROP CONSTRAINT "FK_f1d3288207f0fbb5c35b11c1118"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mar_entries" DROP CONSTRAINT "FK_5e023e4a6643d02e48ac6c14ee8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mar_entries" DROP CONSTRAINT "FK_ac2448ef83468128eea6c1ed78f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_preferences" DROP CONSTRAINT "FK_64c90edc7310c6be7c10c96f675"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "onboarding_tasks" DROP CONSTRAINT "FK_65769a05a5366ff167f1a1d5363"`,
    );
    await queryRunner.query(
      `ALTER TABLE "onboarding_checklists" DROP CONSTRAINT "FK_2f673095f4a2196d326f1d4480d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "onboarding_checklists" DROP CONSTRAINT "FK_e00a19d3398544900fe9fe19767"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_contacts" DROP CONSTRAINT "FK_46e1c26ac317ba0a8de2808df03"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_feature_flags" DROP CONSTRAINT "FK_63e513c62c47dc7820593466e2c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_modules" DROP CONSTRAINT "FK_dc267a9c8e26a51302734708bed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_posts" DROP CONSTRAINT "FK_522525370f6451eb34a58205e08"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_posts" DROP CONSTRAINT "FK_0ddb858e722f74de3972c7aca0f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_posts" DROP CONSTRAINT "FK_13477bd2dffa6863909edd43be8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "claim_lines" DROP CONSTRAINT "FK_cd8759cb322f458c2ce2d0438b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "claim_lines" DROP CONSTRAINT "FK_65c3a591eabdea55a86e4367789"`,
    );
    await queryRunner.query(
      `ALTER TABLE "claims" DROP CONSTRAINT "FK_d4f81e4980e2d48476dcc405d2d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "claims" DROP CONSTRAINT "FK_3f46777b99d3cbf2260b0ee7f12"`,
    );
    await queryRunner.query(
      `ALTER TABLE "claims" DROP CONSTRAINT "FK_9aa986c87f7eaf5c253ae359b8d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "claims" DROP CONSTRAINT "FK_478a2b686380fae03e60be58682"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rate_tables" DROP CONSTRAINT "FK_278f19db4e5bfaf9e62ee2176ca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rate_tables" DROP CONSTRAINT "FK_2a2b1aea4e1f38ab3bfc1bd42a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "remittances" DROP CONSTRAINT "FK_9f5f376866b084c4ebd68e0a524"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_authorizations" DROP CONSTRAINT "FK_cd082e6acb3f4365420301f6c46"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_authorizations" DROP CONSTRAINT "FK_8b18a0ad830e54957da135e72d4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_authorizations" DROP CONSTRAINT "FK_e378b61e0624bcf086c092df3d8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_authorizations" DROP CONSTRAINT "FK_70403e883b776021b44ed110e22"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payer_config" DROP CONSTRAINT "FK_7f2e2c595f2a90f87da6e8c94e3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_codes" DROP CONSTRAINT "FK_ed9f439195ddb72463388c287a5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_records" DROP CONSTRAINT "FK_39b68455bbb6b077aaa2a1d5c37"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_records" DROP CONSTRAINT "FK_c8423a1c9d3828f7d5866e2ead3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_records" DROP CONSTRAINT "FK_02a094385fedff7045166e19776"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_records" DROP CONSTRAINT "FK_3677c3ca5843dc808d2759808b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_records" DROP CONSTRAINT "FK_1de4ab82b441a423363c75977a6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shifts" DROP CONSTRAINT "FK_ea75504762315a29ef084025672"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shifts" DROP CONSTRAINT "FK_5a77b6a77621127db084c7a042b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shifts" DROP CONSTRAINT "FK_a26b82c0848cfc320539640fa46"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shifts" DROP CONSTRAINT "FK_f4e71fdb4bc59e606ef75ead4db"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shifts" DROP CONSTRAINT "FK_5d750ec7e9b1c0c4f4edb89621f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "signed_agreements" DROP CONSTRAINT "FK_f9b06e33e0842147ec15562f19a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "signup_applications" DROP CONSTRAINT "FK_dffd428ac1d233f50626e36be4f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_363623aab86786a0b99e10b03fc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_9a1bf4d0601de6693fc9b31d7f5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_0a13270cd3101fd16b8000e00d4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "programs" DROP CONSTRAINT "FK_1a1ac1fe8476545a8e08d860c3d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff_assignments" DROP CONSTRAINT "FK_012634550eefb596b16355bba66"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff_assignments" DROP CONSTRAINT "FK_e4bccab71e5e4766e406d5184c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff_assignments" DROP CONSTRAINT "FK_6ff0f6a29afcb34aa82e9963298"`,
    );
    await queryRunner.query(
      `ALTER TABLE "individuals" DROP CONSTRAINT "FK_6caf4cd3749ac561d64a50eb468"`,
    );
    await queryRunner.query(
      `ALTER TABLE "individuals" DROP CONSTRAINT "FK_da6120db22c6a2e710de7eba3bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sites" DROP CONSTRAINT "FK_e02358e77afe83fc2a1db7b7ee1"`,
    );
    await queryRunner.query(`DROP TABLE "adjustments"`);
    await queryRunner.query(`DROP TYPE "public"."adjustments_type_enum"`);
    await queryRunner.query(`DROP TABLE "application_documents"`);
    await queryRunner.query(`DROP TABLE "application_notes"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_logs_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_logs_action"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_logs_table_name"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_logs_created_at"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "behavior_plans"`);
    await queryRunner.query(`DROP TABLE "break_glass_sessions"`);
    await queryRunner.query(`DROP TABLE "claim_submissions"`);
    await queryRunner.query(
      `DROP TYPE "public"."claim_submissions_submission_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "correction_requests"`);
    await queryRunner.query(
      `DROP TYPE "public"."correction_requests_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "daily_notes"`);
    await queryRunner.query(`DROP TABLE "evv_corrections"`);
    await queryRunner.query(`DROP TYPE "public"."evv_corrections_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."evv_corrections_punch_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_914b6218eeb56c9f17e255e49c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b236af2f970e14b57134cdf813"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_34ace3f4e9eea92f7009402e56"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_46067080dbd7815a261ce86b94"`,
    );
    await queryRunner.query(`DROP TABLE "evv_punches"`);
    await queryRunner.query(`DROP TYPE "public"."evv_punches_punch_type_enum"`);
    await queryRunner.query(`DROP TABLE "incidents"`);
    await queryRunner.query(`DROP TYPE "public"."incidents_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_824ca52f970e3ca5c8475ccee5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ac0f09364e3701d9ed35435288"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0457ee681a50419881ea2ee796"`,
    );
    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
    await queryRunner.query(`DROP TABLE "isp_data_points"`);
    await queryRunner.query(`DROP TABLE "isp_goals"`);
    await queryRunner.query(`DROP TABLE "mar_entries"`);
    await queryRunner.query(`DROP TABLE "notification_preferences"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9a8a82462cab47c73d25f49261"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f8b7ed75170d2d7dca4477cc94"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aef1c7aef3725068e5540f8f00"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_77ee7b06d6f802000c0846f3a5"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(`DROP TABLE "onboarding_tasks"`);
    await queryRunner.query(
      `DROP TYPE "public"."onboarding_tasks_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "onboarding_checklists"`);
    await queryRunner.query(
      `DROP TYPE "public"."onboarding_checklists_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "org_contacts"`);
    await queryRunner.query(`DROP TABLE "org_feature_flags"`);
    await queryRunner.query(`DROP TABLE "org_modules"`);
    await queryRunner.query(`DROP TABLE "payment_posts"`);
    await queryRunner.query(
      `DROP TYPE "public"."payment_posts_matching_method_enum"`,
    );
    await queryRunner.query(`DROP TABLE "claim_lines"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_478a2b686380fae03e60be5868"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_78214f7ed47cfd76fb8bf6bb28"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3f46777b99d3cbf2260b0ee7f1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4cfb78f7f6a975213106a64a8f"`,
    );
    await queryRunner.query(`DROP TABLE "claims"`);
    await queryRunner.query(`DROP TYPE "public"."claims_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."claims_claim_type_enum"`);
    await queryRunner.query(`DROP TABLE "plan_definitions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d0a04189184d90b64cbd3b3754"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5669b44b2d48e6463ba0d599ca"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_88e37c6fc0b0731268739f8721"`,
    );
    await queryRunner.query(`DROP TABLE "platform_audit_log"`);
    await queryRunner.query(`DROP TABLE "rate_tables"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9f5f376866b084c4ebd68e0a52"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9a0a5e77f570a7c18e0ca1fae4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1b8c067136ebcf90532c560c45"`,
    );
    await queryRunner.query(`DROP TABLE "remittances"`);
    await queryRunner.query(`DROP TYPE "public"."remittances_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_70403e883b776021b44ed110e2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_09069ed4795040c05965e27fb1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8e8565686a691288758e4c3949"`,
    );
    await queryRunner.query(`DROP TABLE "service_authorizations"`);
    await queryRunner.query(
      `DROP TYPE "public"."service_authorizations_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."service_authorizations_unit_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "payer_config"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c857e3228f67312c42c2b1c882"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_035ae5d6f6e3f4bed1d76434ab"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6080d82bb4a188ca2674d25d50"`,
    );
    await queryRunner.query(`DROP TABLE "global_payers"`);
    await queryRunner.query(`DROP TABLE "service_codes"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_00fcfe565f842f2a4d8df06a4a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_43a96d11e63482c95afe83f1b3"`,
    );
    await queryRunner.query(`DROP TABLE "global_service_codes"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1de4ab82b441a423363c75977a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3677c3ca5843dc808d2759808b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_78b594193435542f5ecc1d2919"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3e2ed5436304afbbbeed6adc07"`,
    );
    await queryRunner.query(`DROP TABLE "service_records"`);
    await queryRunner.query(`DROP TYPE "public"."service_records_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5d750ec7e9b1c0c4f4edb89621"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7773186c6722dc2ec0840acdb0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3e044af0f8d48f964102ee2bf6"`,
    );
    await queryRunner.query(`DROP TABLE "shifts"`);
    await queryRunner.query(`DROP TYPE "public"."shifts_status_enum"`);
    await queryRunner.query(`DROP TABLE "signed_agreements"`);
    await queryRunner.query(
      `DROP TYPE "public"."signed_agreements_agreement_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_43f9a2f6db8a71c6563525e1ec"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cfce2bf26530cfa8aabe48f524"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e8f56e9a9c2c6e487e45bebdb5"`,
    );
    await queryRunner.query(`DROP TABLE "signup_applications"`);
    await queryRunner.query(
      `DROP TYPE "public"."signup_applications_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3205edd1545c32cce610fcaba2"`,
    );
    await queryRunner.query(`DROP TABLE "smarttrack_operators"`);
    await queryRunner.query(
      `DROP TYPE "public"."smarttrack_operators_mfa_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."smarttrack_operators_role_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_363623aab86786a0b99e10b03f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6ccf973355b70645eff37774de"`,
    );
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(
      `DROP TYPE "public"."subscriptions_billing_cycle_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_email"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_role"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_auth0_sub"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_mfa_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_organizations_npi"`);
    await queryRunner.query(`DROP INDEX "public"."idx_organizations_ein"`);
    await queryRunner.query(`DROP INDEX "public"."idx_organizations_status"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(`DROP TYPE "public"."organizations_status_enum"`);
    await queryRunner.query(`DROP TABLE "programs"`);
    await queryRunner.query(`DROP TABLE "staff_assignments"`);
    await queryRunner.query(`DROP TABLE "individuals"`);
    await queryRunner.query(`DROP INDEX "public"."idx_sites_program_id"`);
    await queryRunner.query(`DROP TABLE "sites"`);
  }
}
