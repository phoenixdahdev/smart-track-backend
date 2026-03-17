import { PortalServiceRecordController } from './portal-service-record.controller';

describe('PortalServiceRecordController', () => {
  let controller: PortalServiceRecordController;
  let guardianPortalService: { getServiceRecordSummaries: jest.Mock };

  const mockCurrentUser = {
    id: 'guardian-uuid',
    org_id: 'org-uuid',
    role: 'GUARDIAN',
    email: 'guardian@test.com',
    name: 'Guardian User',
    sub_permissions: {},
    session_timeout: 3600,
    mfa_enabled: false,
    mfa_type: 'NONE',
    mfa_verified: true,
    email_verified: true,
  };

  const mockSummary = {
    id: 'sr-uuid',
    service_date: '2026-03-15',
    units_delivered: 4,
    status: 'APPROVED',
    program_id: 'prog-uuid',
    has_daily_notes: true,
  };

  beforeEach(() => {
    guardianPortalService = {
      getServiceRecordSummaries: jest.fn().mockResolvedValue({
        payload: [mockSummary],
        paginationMeta: { total: 1 },
      }),
    };

    controller = new PortalServiceRecordController(guardianPortalService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /portal/individuals/:id/service-records', () => {
    it('should list redacted service records', async () => {
      const result = await controller.list('ind-uuid', mockCurrentUser as never, {});
      expect(result.message).toBe('Service records retrieved');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).not.toHaveProperty('staff_id');
    });
  });
});
