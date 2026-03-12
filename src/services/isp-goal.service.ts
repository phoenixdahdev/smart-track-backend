import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IspGoalDal } from '@dals/isp-goal.dal';
import { EncryptionService } from './encryption.service';
import { AuditLogService } from './audit-log.service';
import { type CreateIspGoalDto } from '@dtos/create-isp-goal.dto';
import { type UpdateIspGoalDto } from '@dtos/update-isp-goal.dto';
import { type IspGoalEntity } from '@entities/isp-goal.entity';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class IspGoalService {
  private readonly logger = new Logger(IspGoalService.name);

  constructor(
    private readonly ispGoalDal: IspGoalDal,
    private readonly encryptionService: EncryptionService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private encryptDescription(value: string | undefined): string | undefined {
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
        `Failed to decrypt field "${fieldName}" for ISP goal — returning null`,
      );
      return null;
    }
  }

  private decryptFields(goal: IspGoalEntity): IspGoalEntity {
    return {
      ...goal,
      description: this.decryptField(goal.description, 'description') ?? '',
    };
  }

  async create(
    dto: CreateIspGoalDto,
    orgId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const encryptedDescription = this.encryptDescription(dto.description);

    const goal = await this.ispGoalDal.create({
      createPayload: {
        org_id: orgId,
        individual_id: dto.individual_id,
        description: encryptedDescription ?? '',
        target: dto.target ?? null,
        effective_start: dto.effective_start,
        effective_end: dto.effective_end ?? null,
        active: true,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'ISP_GOAL_CREATED',
      action_type: 'CREATE',
      table_name: 'isp_goals',
      record_id: goal.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return this.decryptFields(goal);
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

    const result = await this.ispGoalDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { effective_start: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    return {
      payload: result.payload.map((g) => this.decryptFields(g)),
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
    const goal = await this.ispGoalDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!goal) {
      throw new NotFoundException();
    }

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'ISP_GOAL_ACCESSED',
      action_type: 'READ',
      table_name: 'isp_goals',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return this.decryptFields(goal);
  }

  async update(
    id: string,
    orgId: string,
    dto: UpdateIspGoalDto,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const goal = await this.ispGoalDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!goal) {
      throw new NotFoundException();
    }

    const updatePayload: Record<string, unknown> = {};
    if (dto.description !== undefined)
      updatePayload.description = this.encryptDescription(dto.description);
    if (dto.target !== undefined) updatePayload.target = dto.target;
    if (dto.effective_end !== undefined)
      updatePayload.effective_end = dto.effective_end;
    if (dto.active !== undefined) updatePayload.active = dto.active;

    const updated = await this.ispGoalDal.update({
      identifierOptions: { id } as never,
      updatePayload: updatePayload as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: userId,
      user_role: userRole,
      action: 'ISP_GOAL_UPDATED',
      action_type: 'UPDATE',
      table_name: 'isp_goals',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated ? this.decryptFields(updated) : null;
  }
}
