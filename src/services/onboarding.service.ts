import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OnboardingChecklistDal } from '@dals/onboarding-checklist.dal';
import { OnboardingTaskDal } from '@dals/onboarding-task.dal';
import { AuditLogService } from './audit-log.service';
import { OnboardingStatus } from '@enums/onboarding-status.enum';
import { OnboardingTaskStatus } from '@enums/onboarding-task-status.enum';
import { NotificationTriggerService } from './notification-trigger.service';

const STANDARD_TASKS = [
  { task_key: 'configure_org', task_name: 'Configure Organization Profile' },
  { task_key: 'add_programs', task_name: 'Add Programs' },
  { task_key: 'add_sites', task_name: 'Add Sites' },
  { task_key: 'add_staff', task_name: 'Add Staff Members' },
  { task_key: 'add_individuals', task_name: 'Add Individuals' },
  { task_key: 'configure_billing', task_name: 'Configure Billing Settings' },
  { task_key: 'configure_payers', task_name: 'Configure Payer Settings' },
  { task_key: 'training_complete', task_name: 'Complete Staff Training' },
  { task_key: 'test_workflow', task_name: 'Test End-to-End Workflow' },
  { task_key: 'go_live_approval', task_name: 'Go-Live Approval' },
];

@Injectable()
export class OnboardingService {
  constructor(
    private readonly checklistDal: OnboardingChecklistDal,
    private readonly taskDal: OnboardingTaskDal,
    private readonly auditLogService: AuditLogService,
    private readonly notificationTriggerService: NotificationTriggerService,
  ) {}

  async getChecklist(orgId: string) {
    const checklist = await this.checklistDal.get({
      identifierOptions: { org_id: orgId } as never,
    });

    if (!checklist) {
      throw new NotFoundException();
    }

    const tasks = await this.taskDal.find({
      findOptions: { checklist_id: checklist.id } as never,
      order: { created_at: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });

    return { ...checklist, tasks: tasks.payload };
  }

  async createChecklist(orgId: string, specialistId?: string) {
    const checklist = await this.checklistDal.create({
      createPayload: {
        org_id: orgId,
        specialist_id: specialistId ?? null,
        status: OnboardingStatus.NOT_STARTED,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    for (const task of STANDARD_TASKS) {
      await this.taskDal.create({
        createPayload: {
          checklist_id: checklist.id,
          task_key: task.task_key,
          task_name: task.task_name,
          status: OnboardingTaskStatus.PENDING,
        } as never,
        transactionOptions: { useTransaction: false },
      });
    }

    return checklist;
  }

  async assignSpecialist(
    checklistId: string,
    specialistId: string,
    operatorId: string,
    ip: string,
    ua: string,
  ) {
    const checklist = await this.checklistDal.get({
      identifierOptions: { id: checklistId } as never,
    });

    if (!checklist) {
      throw new NotFoundException();
    }

    const updated = await this.checklistDal.update({
      identifierOptions: { id: checklistId } as never,
      updatePayload: { specialist_id: specialistId } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: 'ONBOARDING_SPECIALIST_ASSIGNED',
      target_type: 'onboarding_checklists',
      target_id: checklistId,
      after_val: { specialist_id: specialistId },
      ip_address: ip,
      user_agent: ua,
    });

    return updated;
  }

  async completeTask(
    taskId: string,
    operatorId: string,
    notes?: string,
    ip?: string,
    ua?: string,
  ) {
    const task = await this.taskDal.get({
      identifierOptions: { id: taskId } as never,
    });

    if (!task) {
      throw new NotFoundException();
    }

    if (task.status !== OnboardingTaskStatus.PENDING) {
      throw new BadRequestException('Task is not PENDING');
    }

    const updated = await this.taskDal.update({
      identifierOptions: { id: taskId } as never,
      updatePayload: {
        status: OnboardingTaskStatus.COMPLETED,
        completed_by: operatorId,
        completed_at: new Date(),
        notes: notes ?? null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    // Update checklist to IN_PROGRESS if NOT_STARTED
    const checklist = await this.checklistDal.get({
      identifierOptions: { id: task.checklist_id } as never,
    });
    if (checklist?.status === OnboardingStatus.NOT_STARTED) {
      await this.checklistDal.update({
        identifierOptions: { id: task.checklist_id } as never,
        updatePayload: { status: OnboardingStatus.IN_PROGRESS } as never,
        transactionOptions: { useTransaction: false },
      });
    }

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'ONBOARDING_SPECIALIST',
      action: 'ONBOARDING_TASK_COMPLETED',
      target_type: 'onboarding_tasks',
      target_id: taskId,
      ip_address: ip ?? '',
      user_agent: ua,
    });

    if (checklist?.org_id) {
      this.notificationTriggerService
        .onOnboardingTaskCompleted(checklist.org_id, taskId)
        .catch(() => {});
    }

    return updated;
  }

  async skipTask(
    taskId: string,
    operatorId: string,
    notes?: string,
    ip?: string,
    ua?: string,
  ) {
    const task = await this.taskDal.get({
      identifierOptions: { id: taskId } as never,
    });

    if (!task) {
      throw new NotFoundException();
    }

    if (task.status !== OnboardingTaskStatus.PENDING) {
      throw new BadRequestException('Task is not PENDING');
    }

    const updated = await this.taskDal.update({
      identifierOptions: { id: taskId } as never,
      updatePayload: {
        status: OnboardingTaskStatus.SKIPPED,
        completed_by: operatorId,
        completed_at: new Date(),
        notes: notes ?? null,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'ONBOARDING_SPECIALIST',
      action: 'ONBOARDING_TASK_SKIPPED',
      target_type: 'onboarding_tasks',
      target_id: taskId,
      ip_address: ip ?? '',
      user_agent: ua,
    });

    return updated;
  }

  async completeChecklist(
    checklistId: string,
    operatorId: string,
    ip: string,
    ua: string,
  ) {
    const checklist = await this.checklistDal.get({
      identifierOptions: { id: checklistId } as never,
    });

    if (!checklist) {
      throw new NotFoundException();
    }

    // Verify all tasks are COMPLETED or SKIPPED
    const tasks = await this.taskDal.find({
      findOptions: { checklist_id: checklistId } as never,
      transactionOptions: { useTransaction: false },
    });

    const pendingTasks = tasks.payload.filter(
      (t: { status: OnboardingTaskStatus }) =>
        t.status === OnboardingTaskStatus.PENDING,
    );

    if (pendingTasks.length > 0) {
      throw new BadRequestException(
        `${pendingTasks.length} task(s) still pending`,
      );
    }

    const updated = await this.checklistDal.update({
      identifierOptions: { id: checklistId } as never,
      updatePayload: {
        status: OnboardingStatus.COMPLETED,
        completed_at: new Date(),
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: 'ONBOARDING_COMPLETED',
      target_type: 'onboarding_checklists',
      target_id: checklistId,
      ip_address: ip,
      user_agent: ua,
    });

    if (checklist.org_id) {
      this.notificationTriggerService
        .onOnboardingCompleted(checklist.org_id, checklistId)
        .catch(() => {});
    }

    return updated;
  }
}
