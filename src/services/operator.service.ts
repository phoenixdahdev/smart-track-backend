import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SmarttrackOperatorDal } from '@dals/smarttrack-operator.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateOperatorDto } from '@dtos/create-operator.dto';
import { type UpdateOperatorDto } from '@dtos/update-operator.dto';
import { type PaginationValidator } from '@utils/pagination-utils';
import { PlatformRole } from '@enums/role.enum';

@Injectable()
export class OperatorService {
  constructor(
    private readonly operatorDal: SmarttrackOperatorDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    dto: CreateOperatorDto,
    operatorId: string,
    ip: string,
    ua: string,
  ) {
    const operator = await this.operatorDal.create({
      createPayload: dto as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: dto.role,
      action: 'OPERATOR_CREATED',
      target_type: 'smarttrack_operators',
      target_id: operator.id,
      after_val: operator as unknown as Record<string, unknown>,
      ip_address: ip,
      user_agent: ua,
    });

    return operator;
  }

  async findById(id: string) {
    const operator = await this.operatorDal.get({
      identifierOptions: { id } as never,
    });

    if (!operator) {
      throw new NotFoundException();
    }

    return operator;
  }

  async list(
    pagination?: PaginationValidator,
    filters?: { role?: PlatformRole; active?: boolean },
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = {};
    if (filters?.role) findOptions.role = filters.role;
    if (filters?.active !== undefined) findOptions.active = filters.active;

    return this.operatorDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async update(
    id: string,
    dto: UpdateOperatorDto,
    operatorId: string,
    ip: string,
    ua: string,
  ) {
    const before = await this.findById(id);

    const updated = await this.operatorDal.update({
      identifierOptions: { id } as never,
      updatePayload: dto as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: before.role,
      action: 'OPERATOR_UPDATED',
      target_type: 'smarttrack_operators',
      target_id: id,
      before_val: before as unknown as Record<string, unknown>,
      after_val: updated as unknown as Record<string, unknown>,
      ip_address: ip,
      user_agent: ua,
    });

    return updated;
  }

  async deactivate(id: string, operatorId: string, ip: string, ua: string) {
    const operator = await this.findById(id);

    if (
      operator.role === PlatformRole.PLATFORM_OWNER &&
      operator.id !== operatorId
    ) {
      throw new BadRequestException(
        'PLATFORM_OWNER cannot be deactivated by others',
      );
    }

    const updated = await this.operatorDal.update({
      identifierOptions: { id } as never,
      updatePayload: { active: false } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: operator.role,
      action: 'OPERATOR_DEACTIVATED',
      target_type: 'smarttrack_operators',
      target_id: id,
      before_val: operator as unknown as Record<string, unknown>,
      ip_address: ip,
      user_agent: ua,
    });

    return updated;
  }
}
