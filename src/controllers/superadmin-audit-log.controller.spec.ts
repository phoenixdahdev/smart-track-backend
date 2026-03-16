import { SuperadminAuditLogController } from './superadmin-audit-log.controller';

describe('SuperadminAuditLogController', () => {
  let controller: SuperadminAuditLogController;
  let auditLogDal: { find: jest.Mock };

  const mockLog = {
    id: 'log-uuid',
    operator_id: 'op-uuid',
    action: 'OPERATOR_CREATED',
    target_type: 'smarttrack_operators',
  };

  beforeEach(() => {
    auditLogDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockLog],
        paginationMeta: { total: 1, limit: 20, page: 1, total_pages: 1, has_next: false, has_previous: false },
      }),
    };

    controller = new SuperadminAuditLogController(auditLogDal as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /superadmin/platform/audit-log', () => {
    it('should list audit logs', async () => {
      const result = await controller.list({} as never);

      expect(result.message).toBe('Audit logs retrieved');
      expect(result.data).toHaveLength(1);
    });

    it('should apply operator_id filter', async () => {
      await controller.list({ operator_id: 'op-uuid' } as never);

      expect(auditLogDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({ operator_id: 'op-uuid' }) as unknown,
        }),
      );
    });

    it('should apply action filter', async () => {
      await controller.list({ action: 'OPERATOR_CREATED' } as never);

      expect(auditLogDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({ action: 'OPERATOR_CREATED' }) as unknown,
        }),
      );
    });
  });
});
