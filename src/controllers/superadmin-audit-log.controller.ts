import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlatformAuditLogDal } from '@dals/platform-audit-log.dal';
import { PlatformAuditQueryDto } from '@dtos/platform-audit-query.dto';
import { Roles } from '@decorators/roles.decorator';
import { PlatformRole } from '@enums/role.enum';

@ApiTags('SuperAdmin — Audit Log')
@ApiBearerAuth()
@Roles(
  PlatformRole.PLATFORM_OWNER,
  PlatformRole.PLATFORM_ADMIN,
  PlatformRole.COMPLIANCE_AUDITOR,
)
@Controller('superadmin/platform/audit-log')
export class SuperadminAuditLogController {
  constructor(private readonly auditLogDal: PlatformAuditLogDal) {}

  @ApiOperation({ summary: 'List platform audit logs' })
  @Get()
  async list(@Query() query: PlatformAuditQueryDto) {
    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '20', 10);

    const findOptions: Record<string, unknown> = {};
    if (query.operator_id) findOptions.operator_id = query.operator_id;
    if (query.action) findOptions.action = query.action;
    if (query.target_type) findOptions.target_type = query.target_type;

    const result = await this.auditLogDal.find({
      findOptions: findOptions as never,
      paginationPayload: { page, limit },
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    return {
      message: 'Audit logs retrieved',
      data: result.payload,
      meta: result.paginationMeta,
    };
  }
}
