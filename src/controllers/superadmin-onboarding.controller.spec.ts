import { SuperadminOnboardingController } from './superadmin-onboarding.controller';
import { OnboardingStatus } from '@enums/onboarding-status.enum';
import { OnboardingTaskStatus } from '@enums/onboarding-task-status.enum';
import { PlatformRole } from '@enums/role.enum';

describe('SuperadminOnboardingController', () => {
  let controller: SuperadminOnboardingController;
  let onboardingService: {
    getChecklist: jest.Mock;
    assignSpecialist: jest.Mock;
    completeTask: jest.Mock;
    skipTask: jest.Mock;
    completeChecklist: jest.Mock;
  };

  const mockChecklist = {
    id: 'checklist-uuid',
    org_id: 'org-uuid',
    status: OnboardingStatus.IN_PROGRESS,
    tasks: [],
  };

  const mockCurrentUser = {
    id: 'op-uuid',
    role: PlatformRole.ONBOARDING_SPECIALIST,
    org_id: null,
    email: 'specialist@smarttrack.com',
    name: 'Specialist',
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
    onboardingService = {
      getChecklist: jest.fn().mockResolvedValue(mockChecklist),
      assignSpecialist: jest.fn().mockResolvedValue(mockChecklist),
      completeTask: jest.fn().mockResolvedValue({ id: 'task-uuid', status: OnboardingTaskStatus.COMPLETED }),
      skipTask: jest.fn().mockResolvedValue({ id: 'task-uuid', status: OnboardingTaskStatus.SKIPPED }),
      completeChecklist: jest.fn().mockResolvedValue({ ...mockChecklist, status: OnboardingStatus.COMPLETED }),
    };

    controller = new SuperadminOnboardingController(onboardingService as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /superadmin/onboarding/:orgId', () => {
    it('should get checklist', async () => {
      const result = await controller.getChecklist('org-uuid');
      expect(result.message).toBe('Checklist retrieved');
    });
  });

  describe('POST /superadmin/onboarding/:orgId/assign', () => {
    it('should assign specialist', async () => {
      const result = await controller.assignSpecialist(
        'org-uuid', 'specialist-uuid', mockCurrentUser as never, mockReq as never,
      );
      expect(result.message).toBe('Specialist assigned');
    });
  });

  describe('POST /superadmin/onboarding/tasks/:taskId/complete', () => {
    it('should complete task', async () => {
      const result = await controller.completeTask(
        'task-uuid', { notes: 'Done' }, mockCurrentUser as never, mockReq as never,
      );
      expect(result.message).toBe('Task completed');
    });
  });

  describe('POST /superadmin/onboarding/tasks/:taskId/skip', () => {
    it('should skip task', async () => {
      const result = await controller.skipTask(
        'task-uuid', { notes: 'Not needed' }, mockCurrentUser as never, mockReq as never,
      );
      expect(result.message).toBe('Task skipped');
    });
  });

  describe('POST /superadmin/onboarding/:checklistId/complete', () => {
    it('should complete checklist', async () => {
      const result = await controller.completeChecklist(
        'checklist-uuid', mockCurrentUser as never, mockReq as never,
      );
      expect(result.message).toBe('Checklist completed');
    });
  });
});
