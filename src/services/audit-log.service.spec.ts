import {
  AuditLogService,
  AgencyAuditParams,
  PlatformAuditParams,
} from './audit-log.service';

type AuditCreateArg = {
  createPayload: Record<string, unknown>;
  transactionOptions: { useTransaction: boolean };
};

function getCallPayload(mock: jest.Mock): Record<string, unknown> {
  return (mock.mock.calls[0] as [AuditCreateArg])[0].createPayload;
}

describe('AuditLogService', () => {
  let service: AuditLogService;
  let auditLogDal: { create: jest.Mock };
  let platformAuditLogDal: { create: jest.Mock };

  beforeEach(() => {
    auditLogDal = { create: jest.fn().mockResolvedValue({}) };
    platformAuditLogDal = { create: jest.fn().mockResolvedValue({}) };
    service = new AuditLogService(
      auditLogDal as never,
      platformAuditLogDal as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logAgencyAction', () => {
    const baseParams: AgencyAuditParams = {
      org_id: 'org-1',
      user_id: 'user-1',
      user_role: 'ADMIN',
      action: 'CREATE',
      ip_address: '127.0.0.1',
    };

    it('should create an audit log entry', async () => {
      await service.logAgencyAction(baseParams);

      expect(auditLogDal.create).toHaveBeenCalledWith({
        createPayload: expect.objectContaining({
          org_id: 'org-1',
          user_id: 'user-1',
          action: 'CREATE',
        }) as unknown,
        transactionOptions: { useTransaction: false },
      });
    });

    it('should strip PHI fields from before_val and after_val', async () => {
      await service.logAgencyAction({
        ...baseParams,
        before_val: { name: 'John', ssn: '123-45-6789', diagnosis: 'flu' },
        after_val: { name: 'John', ssn: '999-99-9999', diagnosis: 'cold' },
      });

      const payload = getCallPayload(auditLogDal.create);
      const beforeVal = payload['before_val'] as Record<string, unknown>;
      const afterVal = payload['after_val'] as Record<string, unknown>;
      expect(beforeVal['ssn']).toBe('[REDACTED]');
      expect(beforeVal['diagnosis']).toBe('[REDACTED]');
      expect(beforeVal['name']).toBe('John');
      expect(afterVal['ssn']).toBe('[REDACTED]');
    });

    it('should handle null before_val and after_val', async () => {
      await service.logAgencyAction(baseParams);

      const payload = getCallPayload(auditLogDal.create);
      expect(payload['before_val']).toBeNull();
      expect(payload['after_val']).toBeNull();
    });

    it('should never throw on failure', async () => {
      auditLogDal.create.mockRejectedValue(new Error('DB down'));
      const errorSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation();

      await expect(service.logAgencyAction(baseParams)).resolves.not.toThrow();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to write agency audit log'),
      );
    });

    it('should set optional fields to null when not provided', async () => {
      await service.logAgencyAction(baseParams);

      const payload = getCallPayload(auditLogDal.create);
      expect(payload['action_type']).toBeNull();
      expect(payload['table_name']).toBeNull();
      expect(payload['record_id']).toBeNull();
      expect(payload['user_agent']).toBeNull();
    });
  });

  describe('logPlatformAction', () => {
    const baseParams: PlatformAuditParams = {
      operator_id: 'op-1',
      operator_role: 'PLATFORM_ADMIN',
      action: 'BREAK_GLASS',
      ip_address: '10.0.0.1',
    };

    it('should create a platform audit log entry', async () => {
      await service.logPlatformAction(baseParams);

      expect(platformAuditLogDal.create).toHaveBeenCalledWith({
        createPayload: expect.objectContaining({
          operator_id: 'op-1',
          action: 'BREAK_GLASS',
        }) as unknown,
        transactionOptions: { useTransaction: false },
      });
    });

    it('should strip PHI from platform audit values', async () => {
      await service.logPlatformAction({
        ...baseParams,
        after_val: { ssn: '111-22-3333', status: 'ACTIVE' },
      });

      const payload = getCallPayload(platformAuditLogDal.create);
      const afterVal = payload['after_val'] as Record<string, unknown>;
      expect(afterVal['ssn']).toBe('[REDACTED]');
      expect(afterVal['status']).toBe('ACTIVE');
    });

    it('should never throw on failure', async () => {
      platformAuditLogDal.create.mockRejectedValue(new Error('DB down'));
      const errorSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation();

      await expect(
        service.logPlatformAction(baseParams),
      ).resolves.not.toThrow();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to write platform audit log'),
      );
    });
  });
});
