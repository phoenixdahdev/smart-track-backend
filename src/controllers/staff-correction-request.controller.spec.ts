import { StaffCorrectionRequestController } from './staff-correction-request.controller';

describe('StaffCorrectionRequestController', () => {
  let controller: StaffCorrectionRequestController;
  let correctionRequestService: {
    create: jest.Mock;
    listByServiceRecord: jest.Mock;
    findById: jest.Mock;
  };

  const mockRequest = { id: 'cr-uuid', status: 'PENDING' };
  const mockCurrentUser = {
    id: 'staff-uuid', org_id: 'org-uuid', role: 'DSP',
    email: 'dsp@test.com', name: 'DSP', sub_permissions: {},
    session_timeout: 3600, mfa_enabled: false, email_verified: true,
  };
  const mockReq = {
    ip: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  };

  beforeEach(() => {
    correctionRequestService = {
      create: jest.fn().mockResolvedValue(mockRequest),
      listByServiceRecord: jest.fn().mockResolvedValue({
        payload: [mockRequest], paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockRequest),
    };
    controller = new StaffCorrectionRequestController(correctionRequestService as never);
  });

  it('should be defined', () => { expect(controller).toBeDefined(); });

  describe('POST /staff/correction-requests', () => {
    it('should create a correction request', async () => {
      const dto = { service_record_id: 'sr-uuid', requested_changes: 'Fix units' };
      const result = await controller.create(dto, mockCurrentUser as never, mockReq as never);
      expect(result.message).toBe('Correction request created');
    });
  });

  describe('GET /staff/correction-requests/by-service-record/:id', () => {
    it('should list by service record', async () => {
      const result = await controller.listByServiceRecord('sr-uuid', 'org-uuid');
      expect(result.data).toHaveLength(1);
    });
  });
});
