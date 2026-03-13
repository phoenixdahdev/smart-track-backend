import { SupervisorEvvCorrectionController } from './supervisor-evv-correction.controller';
import { CorrectionStatus } from '@enums/correction-status.enum';

describe('SupervisorEvvCorrectionController', () => {
  let controller: SupervisorEvvCorrectionController;
  let evvCorrectionService: {
    listPending: jest.Mock;
    findById: jest.Mock;
    approve: jest.Mock;
    reject: jest.Mock;
  };

  const mockCorrection = {
    id: 'corr-uuid',
    org_id: 'org-uuid',
    status: CorrectionStatus.PENDING,
  };

  const mockCurrentUser = {
    id: 'supervisor-uuid',
    org_id: 'org-uuid',
    role: 'SUPERVISOR',
    email: 'sup@test.com',
    name: 'Supervisor',
    sub_permissions: {},
    session_timeout: 3600,
    mfa_enabled: false,
    email_verified: true,
  };

  const mockReq = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  };

  beforeEach(() => {
    evvCorrectionService = {
      listPending: jest.fn().mockResolvedValue({
        payload: [mockCorrection],
        paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockCorrection),
      approve: jest.fn().mockResolvedValue({
        ...mockCorrection,
        status: CorrectionStatus.APPROVED,
      }),
      reject: jest.fn().mockResolvedValue({
        ...mockCorrection,
        status: CorrectionStatus.REJECTED,
      }),
    };

    controller = new SupervisorEvvCorrectionController(
      evvCorrectionService as never,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /supervisor/evv-corrections/pending', () => {
    it('should list pending corrections', async () => {
      const result = await controller.listPending(
        mockCurrentUser as never, {} as never,
      );

      expect(result.message).toBe('Pending EVV corrections retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('PATCH /supervisor/evv-corrections/:id/approve', () => {
    it('should approve a correction', async () => {
      const result = await controller.approve(
        'corr-uuid', { reviewer_notes: 'OK' },
        mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('EVV correction approved');
      expect(evvCorrectionService.approve).toHaveBeenCalled();
    });
  });

  describe('PATCH /supervisor/evv-corrections/:id/reject', () => {
    it('should reject a correction', async () => {
      const result = await controller.reject(
        'corr-uuid', { reviewer_notes: 'Invalid' },
        mockCurrentUser as never, mockReq as never,
      );

      expect(result.message).toBe('EVV correction rejected');
      expect(evvCorrectionService.reject).toHaveBeenCalled();
    });
  });
});
