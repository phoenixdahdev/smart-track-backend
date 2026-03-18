import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 12: Hardening & Compliance
 * - RLS policies on all tenant tables (idempotent — drops existing before creating)
 * - Composite indexes for analytics/reporting performance
 * - Audit log immutability triggers
 */
export class Phase12HardeningRlsIndexes1710768000000 implements MigrationInterface {
  name = 'Phase12HardeningRlsIndexes1710768000000';

  // All tables extending TenantBaseEntity (have org_id NOT NULL)
  private readonly tenantTables = [
    'programs',
    'service_authorizations',
    'audit_logs',
    'isp_goals',
    'isp_data_points',
    'adl_categories',
    'service_codes',
    'staff_assignments',
    'notification_preferences',
    'guardian_individuals',
    'adl_entries',
    'remittances',
    'mar_entries',
    'individual_payer_coverages',
    'rate_tables',
    'correction_requests',
    'notifications',
    'incidents',
    'shifts',
    'claim_lines',
    'claim_submissions',
    'service_records',
    'sites',
    'daily_notes',
    'payer_config',
    'evv_punches',
    'individuals',
    'payment_posts',
    'claims',
    'behavior_plans',
    'evv_corrections',
    'adjustments',
    'claim_status_history',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 7A: RLS policies on all tenant tables
    for (const table of this.tenantTables) {
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
      await queryRunner.query(
        `DROP POLICY IF EXISTS "${table}_tenant_isolation" ON "${table}"`,
      );
      await queryRunner.query(
        `CREATE POLICY "${table}_tenant_isolation" ON "${table}"
          USING (org_id = current_setting('app.current_org_id', true)::uuid)`,
      );
    }

    // Special case: users (nullable org_id, extends BaseEntity not TenantBaseEntity)
    await queryRunner.query(`ALTER TABLE "users" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "users" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(
      `DROP POLICY IF EXISTS "users_tenant_isolation" ON "users"`,
    );
    await queryRunner.query(
      `CREATE POLICY "users_tenant_isolation" ON "users"
        USING (org_id IS NULL OR org_id = current_setting('app.current_org_id', true)::uuid)`,
    );

    // 7B: Composite indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_service_records_org_status ON service_records(org_id, status)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_service_records_org_staff ON service_records(org_id, staff_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_service_records_org_date ON service_records(org_id, service_date)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_claims_org_status ON claims(org_id, status)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_claims_org_payer ON claims(org_id, payer_config_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_evv_punches_org_staff ON evv_punches(org_id, staff_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_evv_punches_org_timestamp ON evv_punches(org_id, "timestamp")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_shifts_org_staff ON shifts(org_id, staff_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_shifts_org_date ON shifts(org_id, shift_date)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id) WHERE org_id IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_daily_notes_org_id ON daily_notes(org_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_individuals_org_id ON individuals(org_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_org_user ON notifications(org_id, user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON audit_logs(org_id, created_at)`,
    );

    // 7C: Audit log immutability triggers
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION prevent_audit_log_modification() RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'Audit logs are immutable';
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS audit_logs_immutable ON audit_logs
    `);
    await queryRunner.query(`
      CREATE TRIGGER audit_logs_immutable
        BEFORE UPDATE OR DELETE ON audit_logs
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification()
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS platform_audit_log_immutable ON platform_audit_log
    `);
    await queryRunner.query(`
      CREATE TRIGGER platform_audit_log_immutable
        BEFORE UPDATE OR DELETE ON platform_audit_log
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(`DROP TRIGGER IF EXISTS platform_audit_log_immutable ON platform_audit_log`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS audit_logs_immutable ON audit_logs`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS prevent_audit_log_modification()`);

    // Drop composite indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_logs_org_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_org_user`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_individuals_org_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_daily_notes_org_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_org_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_shifts_org_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_shifts_org_staff`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_evv_punches_org_timestamp`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_evv_punches_org_staff`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_claims_org_payer`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_claims_org_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_service_records_org_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_service_records_org_staff`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_service_records_org_status`);

    // Drop RLS on users
    await queryRunner.query(`DROP POLICY IF EXISTS "users_tenant_isolation" ON "users"`);
    await queryRunner.query(`ALTER TABLE "users" DISABLE ROW LEVEL SECURITY`);

    // Drop RLS on tenant tables
    for (const table of [...this.tenantTables].reverse()) {
      await queryRunner.query(`DROP POLICY IF EXISTS "${table}_tenant_isolation" ON "${table}"`);
      await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }
  }
}
