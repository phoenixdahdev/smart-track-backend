import { SupervisorCorrectionRequestController } from './supervisor-correction-request.controller';

describe('SupervisorCorrectionRequestController', () => {
  let controller: SupervisorCorrectionRequestController;
  let correctionRequestService: {
    listPending: jest.Mock;
    findById: jest.Mock;
    approve: jest.Mock;
    reject: jest.Mock;
  };

  const mockRequest = { id: 'cr-uuid', status: 'PENDING' };
  const mockCurrentUser = {
    id: 'supervisor-uuid', org_id: 'org-uuid', role: 'SUPERVISOR',
    email: 'sup@test.com', name: 'Supervisor', sub_permissions: {},
    session_timeout: 1800, mfa_enabled: false, mfa_type: 'NONE', mfa_verified: true, email_verified: true,
  };
  const mockReq = {
    ip: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  };

  beforeEach(() => {
    correctionRequestService = {
      listPending: jest.fn().mockResolvedValue({
        payload: [mockRequest], paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockRequest),
      approve: jest.fn().mockResolvedValue({ ...mockRequest, status: 'APPROVED' }),
      reject: jest.fn().mockResolvedValue({ ...mockRequest, status: 'REJECTED' }),
    };
    controller = new SupervisorCorrectionRequestController(correctionRequestService as never);
  });

  it('should be defined', () => { expect(controller).toBeDefined(); });

  describe('GET /supervisor/correction-requests/pending', () => {
    it('should return pending requests', async () => {
      const result = await controller.listPending(mockCurrentUser as never, {} as never);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('PATCH /supervisor/correction-requests/:id/approve', () => {
    it('should approve a correction request', async () => {
      const result = await controller.approve(
        'cr-uuid',
        { reviewer_notes: 'Approved' },
        mockCurrentUser as never,
        mockReq as never,
      );
      expect(result.message).toBe('Correction request approved');
    });
  });

  describe('PATCH /supervisor/correction-requests/:id/reject', () => {
    it('should reject a correction request', async () => {
      const result = await controller.reject(
        'cr-uuid',
        { reviewer_notes: 'Invalid' },
        mockCurrentUser as never,
        mockReq as never,
      );
      expect(result.message).toBe('Correction request rejected');
    });
  });
});
