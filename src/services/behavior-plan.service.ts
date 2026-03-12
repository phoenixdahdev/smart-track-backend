import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BehaviorPlanDal } from '@dals/behavior-plan.dal';
import { EncryptionService } from './encryption.service';
import { AuditLogService } from './audit-log.service';
import { type CreateBehaviorPlanDto } from '@dtos/create-behavior-plan.dto';
import { type UpdateBehaviorPlanDto } from '@dtos/update-behavior-plan.dto';
import { type BehaviorPlanEntity } from '@entities/behavior-plan.entity';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class BehaviorPlanService {
  private readonly logger = new Logger(BehaviorPlanService.name);

  constructor(
    private readonly behaviorPlanDal: BehaviorPlanDal,
    private readonly encryptionService: EncryptionService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private encryptContent(value: string | undefined): string | undefined {
    if (value === undefined) return undefined;
    return value ? this.encryptionService.encrypt(value) : '';
  }

  private decryptField(
    value: string | null | undefined,
    fieldName: string,
  ): string | null {
    if (!value) return null;
    try {
      return this.encryptionService.decrypt(value);
    } catch {
      this.logger.warn(
        `Failed to decrypt field "${fieldName}" for behavior plan — returning null`,
      );
      return null;
    }
  }

  private decryptFields(plan: BehaviorPlanEntity): BehaviorPlanEntity {
    return {
      ...plan,
      content: this.decryptField(plan.content, 'content') ?? '',
    };
  }

  async create(
    dto: CreateBehaviorPlanDto,
    orgId: string,
    clinicianId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const encryptedContent = this.encryptContent(dto.content);

    const plan = await this.behaviorPlanDal.create({
      createPayload: {
        org_id: orgId,
        individual_id: dto.individual_id,
        clinician_id: clinicianId,
        version: 1,
        content: encryptedContent ?? '',
        effective_date: dto.effective_date,
        end_date: dto.end_date ?? null,
        active: true,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: clinicianId,
      user_role: userRole,
      action: 'BEHAVIOR_PLAN_CREATED',
      action_type: 'CREATE',
      table_name: 'behavior_plans',
      record_id: plan.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return this.decryptFields(plan);
  }

  async createNewVersion(
    individualId: string,
    orgId: string,
    dto: CreateBehaviorPlanDto,
    clinicianId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const currentPlan = await this.behaviorPlanDal.get({
      identifierOptions: {
        individual_id: individualId,
        org_id: orgId,
        active: true,
      } as never,
    });

    const newVersion = currentPlan ? currentPlan.version + 1 : 1;

    if (currentPlan) {
      await this.behaviorPlanDal.update({
        identifierOptions: { id: currentPlan.id } as never,
        updatePayload: { active: false } as never,
        transactionOptions: { useTransaction: false },
      });
    }

    const encryptedContent = this.encryptContent(dto.content);

    const plan = await this.behaviorPlanDal.create({
      createPayload: {
        org_id: orgId,
        individual_id: individualId,
        clinician_id: clinicianId,
        version: newVersion,
        content: encryptedContent ?? '',
        effective_date: dto.effective_date,
        end_date: dto.end_date ?? null,
        active: true,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: clinicianId,
      user_role: userRole,
      action: 'BEHAVIOR_PLAN_NEW_VERSION',
      action_type: 'CREATE',
      table_name: 'behavior_plans',
      record_id: plan.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return this.decryptFields(plan);
  }

  async listByIndividual(
    individualId: string,
    orgId: string,
    pagination?: PaginationValidator,
    activeOnly?: boolean,
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = {
      individual_id: individualId,
      org_id: orgId,
    };
    if (activeOnly) {
      findOptions.active = true;
    }

    const result = await this.behaviorPlanDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { version: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    return {
      payload: result.payload.map((p) => this.decryptFields(p)),
      paginationMeta: result.paginationMeta,
    };
  }

  async findById(
    id: string,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const plan = await this.behaviorPlanDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!plan) {
      throw new NotFoundException();
    }

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'BEHAVIOR_PLAN_ACCESSED',
      action_type: 'READ',
      table_name: 'behavior_plans',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return this.decryptFields(plan);
  }

  async update(
    id: string,
    orgId: string,
    dto: UpdateBehaviorPlanDto,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const plan = await this.behaviorPlanDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!plan) {
      throw new NotFoundException();
    }

    const updatePayload: Record<string, unknown> = {};
    if (dto.content !== undefined)
      updatePayload.content = this.encryptContent(dto.content);
    if (dto.end_date !== undefined) updatePayload.end_date = dto.end_date;
    if (dto.active !== undefined) updatePayload.active = dto.active;

    const updated = await this.behaviorPlanDal.update({
      identifierOptions: { id } as never,
      updatePayload: updatePayload as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'BEHAVIOR_PLAN_UPDATED',
      action_type: 'UPDATE',
      table_name: 'behavior_plans',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated ? this.decryptFields(updated) : null;
  }
}
