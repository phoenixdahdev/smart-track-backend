import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingStatus } from '@enums/onboarding-status.enum';
import { OnboardingTaskStatus } from '@enums/onboarding-task-status.enum';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let checklistDal: { get: jest.Mock; create: jest.Mock; update: jest.Mock };
  let taskDal: { get: jest.Mock; find: jest.Mock; create: jest.Mock; update: jest.Mock };
  let auditLogService: { logPlatformAction: jest.Mock };

  const mockChecklist = {
    id: 'checklist-uuid',
    org_id: 'org-uuid',
    specialist_id: null,
    status: OnboardingStatus.NOT_STARTED,
  };

  const mockTask = {
    id: 'task-uuid',
    checklist_id: 'checklist-uuid',
    task_key: 'configure_org',
    task_name: 'Configure Organization Profile',
    status: OnboardingTaskStatus.PENDING,
    completed_by: null,
    completed_at: null,
  };

  beforeEach(() => {
    checklistDal = {
      get: jest.fn().mockResolvedValue(mockChecklist),
      create: jest.fn().mockResolvedValue(mockChecklist),
      update: jest.fn().mockResolvedValue({ ...mockChecklist, status: OnboardingStatus.IN_PROGRESS }),
    };
    taskDal = {
      get: jest.fn().mockResolvedValue(mockTask),
      find: jest.fn().mockResolvedValue({
        payload: [mockTask],
        paginationMeta: { total: 1 },
      }),
      create: jest.fn().mockResolvedValue(mockTask),
      update: jest.fn().mockResolvedValue({ ...mockTask, status: OnboardingTaskStatus.COMPLETED }),
    };
    auditLogService = { logPlatformAction: jest.fn().mockResolvedValue(undefined) };

    service = new OnboardingService(
      checklistDal as never,
      taskDal as never,
      auditLogService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getChecklist', () => {
    it('should return checklist with tasks', async () => {
      const result = await service.getChecklist('org-uuid');

      expect(result.id).toBe('checklist-uuid');
      expect(result.tasks).toHaveLength(1);
    });

    it('should throw NotFoundException when checklist not found', async () => {
      checklistDal.get.mockResolvedValue(null);

      await expect(service.getChecklist('bad-org')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createChecklist', () => {
    it('should create checklist with standard tasks', async () => {
      const result = await service.createChecklist('org-uuid');

      expect(result.id).toBe('checklist-uuid');
      expect(taskDal.create).toHaveBeenCalledTimes(10);
    });
  });

  describe('assignSpecialist', () => {
    it('should assign specialist to checklist', async () => {
      await service.assignSpecialist('checklist-uuid', 'specialist-uuid', 'op-uuid', '127.0.0.1', 'jest');

      expect(checklistDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({ specialist_id: 'specialist-uuid' }) as unknown,
        }),
      );
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ONBOARDING_SPECIALIST_ASSIGNED' }),
      );
    });

    it('should throw NotFoundException when checklist not found', async () => {
      checklistDal.get.mockResolvedValue(null);

      await expect(
        service.assignSpecialist('bad-id', 'specialist-uuid', 'op-uuid', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('completeTask', () => {
    it('should complete a pending task', async () => {
      const result = await service.completeTask('task-uuid', 'op-uuid', 'Done', '127.0.0.1', 'jest');

      expect(result.status).toBe(OnboardingTaskStatus.COMPLETED);
      expect(taskDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: OnboardingTaskStatus.COMPLETED,
            completed_by: 'op-uuid',
          }) as unknown,
        }),
      );
    });

    it('should throw NotFoundException when task not found', async () => {
      taskDal.get.mockResolvedValue(null);

      await expect(
        service.completeTask('bad-id', 'op-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when task is not PENDING', async () => {
      taskDal.get.mockResolvedValue({ ...mockTask, status: OnboardingTaskStatus.COMPLETED });

      await expect(
        service.completeTask('task-uuid', 'op-uuid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update checklist to IN_PROGRESS if NOT_STARTED', async () => {
      await service.completeTask('task-uuid', 'op-uuid');

      expect(checklistDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({ status: OnboardingStatus.IN_PROGRESS }) as unknown,
        }),
      );
    });
  });

  describe('skipTask', () => {
    it('should skip a pending task', async () => {
      await service.skipTask('task-uuid', 'op-uuid', 'Not needed');

      expect(taskDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: OnboardingTaskStatus.SKIPPED,
          }) as unknown,
        }),
      );
    });

    it('should throw BadRequestException when task is not PENDING', async () => {
      taskDal.get.mockResolvedValue({ ...mockTask, status: OnboardingTaskStatus.COMPLETED });

      await expect(
        service.skipTask('task-uuid', 'op-uuid'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeChecklist', () => {
    it('should complete checklist when all tasks done', async () => {
      taskDal.find.mockResolvedValue({
        payload: [{ ...mockTask, status: OnboardingTaskStatus.COMPLETED }],
        paginationMeta: { total: 1 },
      });

      await service.completeChecklist('checklist-uuid', 'op-uuid', '127.0.0.1', 'jest');

      expect(checklistDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: OnboardingStatus.COMPLETED,
          }) as unknown,
        }),
      );
    });

    it('should throw BadRequestException when tasks still pending', async () => {
      taskDal.find.mockResolvedValue({
        payload: [mockTask],
        paginationMeta: { total: 1 },
      });

      await expect(
        service.completeChecklist('checklist-uuid', 'op-uuid', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when checklist not found', async () => {
      checklistDal.get.mockResolvedValue(null);

      await expect(
        service.completeChecklist('bad-id', 'op-uuid', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
