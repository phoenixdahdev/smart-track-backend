import { SupervisorServiceRecordController } from './supervisor-service-record.controller';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';

describe('SupervisorServiceRecordController', () => {
  let controller: SupervisorServiceRecordController;
  let serviceRecordService: {
    listPendingReview: jest.Mock;
    findById: jest.Mock;
    approve: jest.Mock;
    reject: jest.Mock;
  };

  const mockRecord = {
    id: 'sr-uuid',
    org_id: 'org-uuid',
    status: ServiceRecordStatus.PENDING_REVIEW,
  };

  const mockCurrentUser = {
    id: 'supervisor-uuid',
    org_id: 'org-uuid',
    role: 'SUPERVISOR',
    email: 'supervisor@test.com',
    name: 'Supervisor User',
    sub_permissions: {},
    session_timeout: 1800,
    mfa_enabled: false,
    email_verified: true,
  };

  const mockReq = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  };

  beforeEach(() => {
    serviceRecordService = {
      listPendingReview: jest.fn().mockResolvedValue({
        payload: [mockRecord],
        paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockRecord),
      approve: jest.fn().mockResolvedValue({
        ...mockRecord,
        status: ServiceRecordStatus.APPROVED,
      }),
      reject: jest.fn().mockResolvedValue({
        ...mockRecord,
        status: ServiceRecordStatus.REJECTED,
      }),
    };

    controller = new SupervisorServiceRecordController(
      serviceRecordService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /supervisor/service-records/review-queue', () => {
    it('should return the review queue', async () => {
      const result = await controller.reviewQueue(
        mockCurrentUser as never,
        {} as never,
      );

      expect(result.message).toBe('Review queue retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('PATCH /supervisor/service-records/:id/approve', () => {
    it('should approve a service record', async () => {
      const result = await controller.approve(
        'sr-uuid',
        mockCurrentUser as never,
        mockReq as never,
      );

      expect(result.message).toBe('Service record approved');
      expect(serviceRecordService.approve).toHaveBeenCalledWith(
        'sr-uuid',
        'org-uuid',
        'supervisor-uuid',
        'SUPERVISOR',
        '127.0.0.1',
        'jest',
      );
    });
  });

  describe('PATCH /supervisor/service-records/:id/reject', () => {
    it('should reject a service record with reason', async () => {
      const result = await controller.reject(
        'sr-uuid',
        { rejection_reason: 'Missing docs' },
        mockCurrentUser as never,
        mockReq as never,
      );

      expect(result.message).toBe('Service record rejected');
      expect(serviceRecordService.reject).toHaveBeenCalledWith(
        'sr-uuid',
        'org-uuid',
        'supervisor-uuid',
        'Missing docs',
        'SUPERVISOR',
        '127.0.0.1',
        'jest',
      );
    });
  });
});
