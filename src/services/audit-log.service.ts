import { Injectable, Logger } from '@nestjs/common';
import { AuditLogDal } from '@dals/audit-log.dal';
import { PlatformAuditLogDal } from '@dals/platform-audit-log.dal';

const PHI_FIELDS = new Set([
  'ssn',
  'date_of_birth',
  'dob',
  'diagnosis',
  'medication',
  'medications',
  'medical_record_number',
  'insurance_number',
  'address',
  'phone',
  'emergency_contact',
]);

function stripPhi(
  val: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!val) return null;
  const cleaned: Record<string, unknown> = {};
  for (const key of Object.keys(val)) {
    cleaned[key] = PHI_FIELDS.has(key) ? '[REDACTED]' : val[key];
  }
  return cleaned;
}

export type AgencyAuditParams = {
  org_id: string | null;
  user_id: string;
  user_role: string;
  action: string;
  action_type?: string;
  table_name?: string;
  record_id?: string;
  before_val?: Record<string, unknown> | null;
  after_val?: Record<string, unknown> | null;
  ip_address: string;
  user_agent?: string;
};

export type PlatformAuditParams = {
  operator_id: string;
  operator_role: string;
  action: string;
  target_type?: string;
  target_id?: string;
  before_val?: Record<string, unknown> | null;
  after_val?: Record<string, unknown> | null;
  ip_address: string;
  user_agent?: string;
};

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    private readonly auditLogDal: AuditLogDal,
    private readonly platformAuditLogDal: PlatformAuditLogDal,
  ) {}

  async logAgencyAction(params: AgencyAuditParams): Promise<void> {
    if (!params.org_id) return;

    try {
      await this.auditLogDal.create({
        createPayload: {
          org_id: params.org_id,
          user_id: params.user_id,
          user_role: params.user_role,
          action: params.action,
          action_type: params.action_type ?? null,
          table_name: params.table_name ?? null,
          record_id: params.record_id ?? null,
          before_val: stripPhi(params.before_val ?? null),
          after_val: stripPhi(params.after_val ?? null),
          ip_address: params.ip_address,
          user_agent: params.user_agent ?? null,
        },
        transactionOptions: { useTransaction: false },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to write agency audit log: ${message}`);
    }
  }

  async logPlatformAction(params: PlatformAuditParams): Promise<void> {
    try {
      await this.platformAuditLogDal.create({
        createPayload: {
          operator_id: params.operator_id,
          operator_role: params.operator_role,
          action: params.action,
          target_type: params.target_type ?? null,
          target_id: params.target_id ?? null,
          before_val: stripPhi(params.before_val ?? null),
          after_val: stripPhi(params.after_val ?? null),
          ip_address: params.ip_address,
          user_agent: params.user_agent ?? null,
        },
        transactionOptions: { useTransaction: false },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to write platform audit log: ${message}`);
    }
  }
}
