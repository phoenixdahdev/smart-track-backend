import { ClinicalIspGoalController } from './clinical-isp-goal.controller';

describe('ClinicalIspGoalController', () => {
  let controller: ClinicalIspGoalController;
  let ispGoalService: {
    create: jest.Mock;
    listByIndividual: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
  };

  const mockGoal = { id: 'goal-uuid', description: 'Decrypted goal' };
  const mockCurrentUser = {
    id: 'clinician-uuid',
    org_id: 'org-uuid',
    role: 'CLINICIAN',
    email: 'clinician@test.com',
    name: 'Clinician',
    sub_permissions: {},
    session_timeout: 1800,
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
    ispGoalService = {
      create: jest.fn().mockResolvedValue(mockGoal),
      listByIndividual: jest.fn().mockResolvedValue({
        payload: [mockGoal],
        paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockGoal),
      update: jest.fn().mockResolvedValue(mockGoal),
    };

    controller = new ClinicalIspGoalController(ispGoalService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /clinical/isp-goals', () => {
    it('should create a goal', async () => {
      const dto = {
        individual_id: 'ind-uuid',
        description: 'Test goal',
        effective_start: '2026-03-01',
      };
      const result = await controller.create(dto, mockCurrentUser as never, mockReq as never);

      expect(result.message).toBe('ISP goal created');
      expect(ispGoalService.create).toHaveBeenCalled();
    });
  });

  describe('GET /clinical/isp-goals/by-individual/:id', () => {
    it('should list goals by individual', async () => {
      const result = await controller.listByIndividual('ind-uuid', 'org-uuid', {} as never);

      expect(result.data).toHaveLength(1);
    });
  });
});
