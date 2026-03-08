import { Injectable, NotFoundException } from '@nestjs/common';
import { SiteDal } from '@dals/site.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateSiteDto } from '@dtos/create-site.dto';
import { type UpdateSiteDto } from '@dtos/update-site.dto';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class SiteService {
  constructor(
    private readonly siteDal: SiteDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async list(orgId: string, pagination?: PaginationValidator) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    return this.siteDal.find({
      findOptions: { org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { name: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async listByProgram(
    programId: string,
    orgId: string,
    pagination?: PaginationValidator,
  ) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    return this.siteDal.find({
      findOptions: { program_id: programId, org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { name: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async create(
    dto: CreateSiteDto,
    orgId: string,
    requestingUserId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const site = await this.siteDal.create({
      createPayload: {
        org_id: orgId,
        program_id: dto.program_id,
        name: dto.name,
        address_line1: dto.address_line1,
        address_line2: dto.address_line2 ?? null,
        city: dto.city,
        state: dto.state,
        zip: dto.zip,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        active: dto.active ?? true,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: requestingUserId,
      user_role: userRole,
      action: 'SITE_CREATED',
      action_type: 'CREATE',
      table_name: 'sites',
      record_id: site.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return site;
  }

  async findById(id: string, orgId: string) {
    const site = await this.siteDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!site) {
      throw new NotFoundException();
    }

    return site;
  }

  async update(
    id: string,
    orgId: string,
    dto: UpdateSiteDto,
    requestingUserId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ) {
    const site = await this.siteDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!site) {
      throw new NotFoundException();
    }

    const updated = await this.siteDal.update({
      identifierOptions: { id } as never,
      updatePayload: dto as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: requestingUserId,
      user_role: userRole,
      action: 'SITE_UPDATED',
      action_type: 'UPDATE',
      table_name: 'sites',
      record_id: id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }
}
