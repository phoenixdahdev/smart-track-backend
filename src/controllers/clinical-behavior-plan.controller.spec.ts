import { ClinicalBehaviorPlanController } from './clinical-behavior-plan.controller';

describe('ClinicalBehaviorPlanController', () => {
  let controller: ClinicalBehaviorPlanController;
  let behaviorPlanService: {
    create: jest.Mock;
    createNewVersion: jest.Mock;
    listByIndividual: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
  };

  const mockPlan = { id: 'bp-uuid', content: 'Decrypted' };
  const mockCurrentUser = {
    id: 'clinician-uuid', org_id: 'org-uuid', role: 'CLINICIAN',
    email: 'cli@test.com', name: 'Clinician', sub_permissions: {},
    session_timeout: 1800, mfa_enabled: false, email_verified: true,
  };
  const mockReq = {
    ip: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'jest' },
  };

  beforeEach(() => {
    behaviorPlanService = {
      create: jest.fn().mockResolvedValue(mockPlan),
      createNewVersion: jest.fn().mockResolvedValue({ ...mockPlan, version: 2 }),
      listByIndividual: jest.fn().mockResolvedValue({
        payload: [mockPlan], paginationMeta: { total: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockPlan),
      update: jest.fn().mockResolvedValue(mockPlan),
    };
    controller = new ClinicalBehaviorPlanController(behaviorPlanService as never);
  });

  it('should be defined', () => { expect(controller).toBeDefined(); });

  describe('POST /clinical/behavior-plans', () => {
    it('should create a plan', async () => {
      const dto = {
        individual_id: 'ind-uuid', content: 'Plan', effective_date: '2026-03-01',
      };
      const result = await controller.create(dto, mockCurrentUser as never, mockReq as never);
      expect(result.message).toBe('Behavior plan created');
    });
  });

  describe('POST /clinical/behavior-plans/by-individual/:id/new-version', () => {
    it('should create a new version', async () => {
      const dto = {
        individual_id: 'ind-uuid', content: 'Plan v2', effective_date: '2026-06-01',
      };
      const result = await controller.createNewVersion(
        'ind-uuid', dto, mockCurrentUser as never, mockReq as never,
      );
      expect(result.message).toBe('New behavior plan version created');
    });
  });

  describe('GET /clinical/behavior-plans/by-individual/:id', () => {
    it('should list plans', async () => {
      const result = await controller.listByIndividual('ind-uuid', 'org-uuid', {} as never);
      expect(result.data).toHaveLength(1);
    });
  });
});
