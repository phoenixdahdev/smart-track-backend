import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IspDataPointDal } from '@dals/isp-data-point.dal';
import { IspGoalDal } from '@dals/isp-goal.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateIspDataPointDto } from '@dtos/create-isp-data-point.dto';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class IspDataPointService {
  constructor(
    private readonly ispDataPointDal: IspDataPointDal,
    private readonly ispGoalDal: IspGoalDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    dto: CreateIspDataPointDto,
    orgId: string,
    recordedBy: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const goal = await this.ispGoalDal.get({
      identifierOptions: { id: dto.goal_id, org_id: orgId } as never,
    });

    if (!goal) {
      throw new NotFoundException('ISP goal not found');
    }

    const dataPoint = await this.ispDataPointDal.create({
      createPayload: {
        org_id: orgId,
        goal_id: dto.goal_id,
        service_record_id: dto.service_record_id ?? null,
        value: dto.value,
        recorded_at: new Date(),
        recorded_by: recordedBy,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: recordedBy,
      user_role: userRole,
      action: 'ISP_DATA_POINT_CREATED',
      action_type: 'CREATE',
      table_name: 'isp_data_points',
      record_id: dataPoint.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return dataPoint;
  }

  async listByGoal(
    goalId: string,
    orgId: string,
    pagination?: PaginationValidator,
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    return this.ispDataPointDal.find({
      findOptions: { goal_id: goalId, org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { recorded_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async listByServiceRecord(
    serviceRecordId: string,
    orgId: string,
  ) {
    return this.ispDataPointDal.find({
      findOptions: {
        service_record_id: serviceRecordId,
        org_id: orgId,
      } as never,
      order: { recorded_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }
}
