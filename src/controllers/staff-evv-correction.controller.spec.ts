import { StaffEvvCorrectionController } from './staff-evv-correction.controller';
import { CorrectionStatus } from '@enums/correction-status.enum';
import { PunchType } from '@enums/punch-type.enum';

describe('StaffEvvCorrectionController', () => {
  let controller: StaffEvvCorrectionController;
  let evvCorrectionService: {
    create: jest.Mock;
    listByStaff: jest.Mock;
    findById: jest.Mock;
  };

  const mockCorrection = {
    id: 'corr-uuid',
    org_id: 'org-uuid',
    staff_id: 'staff-uuid',
    status: CorrectionStatus.PENDING,
  };

  const mockCurrentUser = {
    id: 'staff-uuid',
    org_id: 'org-uuid',
    role: 'DSP',
    email: 'dsp@test.com',
    name: 'DSP User',
    sub_permissions: {},
    session_timeout: 3600,
    mfa_enabled: false,
    mfa_type: 'NONE',
    mfa_verified: true,
    email_verified: true,
  };

  const mockReq = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  };

  beforeEach(() => {
    evvCorrectionService = {
      create: jest.fn().mockResolvedValue(mockCorrection),
      listByStaff: jest.fn().mockResolvedValue({
        payload: [mockCorrection],
        paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockCorrection),
    };

    controller = new StaffEvvCorrectionController(evvCorrectionService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /staff/evv-corrections', () => {
    it('should create a correction request', async () => {
      const dto = {
        individual_id: 'ind-uuid',
        punch_type: PunchType.CLOCK_IN,
        requested_time: '2026-03-10T08:00:00.000Z',
        reason: 'Forgot to clock in',
      };

      const result = await controller.create(dto, mockCurrentUser as never, mockReq as never);

      expect(result.message).toBe('EVV correction request created');
      expect(evvCorrectionService.create).toHaveBeenCalled();
    });
  });

  describe('GET /staff/evv-corrections', () => {
    it('should list my corrections', async () => {
      const result = await controller.list(mockCurrentUser as never, {} as never);

      expect(result.message).toBe('EVV corrections retrieved');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /staff/evv-corrections/:id', () => {
    it('should get a correction by ID', async () => {
      const result = await controller.findById('corr-uuid', 'org-uuid');

      expect(result.message).toBe('EVV correction retrieved');
    });
  });
});
