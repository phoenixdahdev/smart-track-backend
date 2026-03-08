import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserDal } from '@dals/user.dal';
import { AuditLogService } from './audit-log.service';
import { type CreateUserDto } from '@dtos/create-user.dto';
import { type UpdateUserDto } from '@dtos/update-user.dto';
import { UserStatus } from '@enums/user-status.enum';
import { type AgencyRole } from '@enums/role.enum';
import { type PaginationValidator } from '@utils/pagination-utils';

@Injectable()
export class UserService {
  constructor(
    private readonly userDal: UserDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async list(orgId: string, pagination?: PaginationValidator) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    const result = await this.userDal.find({
      findOptions: { org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { created_at: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });

    return result;
  }

  async invite(dto: CreateUserDto, orgId: string) {
    const existing = await this.userDal.get({
      identifierOptions: { email: dto.email } as never,
    });
    if (existing) {
      throw new BadRequestException('A user with this email already exists');
    }

    const user = await this.userDal.create({
      createPayload: {
        org_id: orgId,
        name: dto.name,
        email: dto.email,
        role: dto.role,
        phone: dto.phone ?? null,
        supervisor_id: dto.supervisor_id ?? null,
        sub_permissions: dto.sub_permissions ?? {},
        status: UserStatus.PENDING_INVITE,
        password: null,
        email_verified: false,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    return user;
  }

  async findById(id: string, orgId: string) {
    const user = await this.userDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  async update(id: string, orgId: string, dto: UpdateUserDto) {
    const user = await this.userDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!user) {
      throw new NotFoundException();
    }

    return this.userDal.update({
      identifierOptions: { id } as never,
      updatePayload: dto as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async assignRole(
    id: string,
    orgId: string,
    role: AgencyRole,
    requestingUserId: string,
    ip: string,
    userAgent: string,
  ) {
    const user = await this.userDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!user) {
      throw new NotFoundException();
    }

    const previousRole = user.role;

    const updated = await this.userDal.update({
      identifierOptions: { id } as never,
      updatePayload: { role } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logAgencyAction({
      org_id: orgId,
      user_id: requestingUserId,
      user_role: role,
      action: 'ROLE_ASSIGNED',
      action_type: 'UPDATE',
      table_name: 'users',
      record_id: id,
      before_val: { role: previousRole },
      after_val: { role },
      ip_address: ip,
      user_agent: userAgent,
    });

    return updated;
  }

  async updateSubPermissions(
    id: string,
    orgId: string,
    sub_permissions: Record<string, boolean>,
  ) {
    const user = await this.userDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!user) {
      throw new NotFoundException();
    }

    return this.userDal.update({
      identifierOptions: { id } as never,
      updatePayload: { sub_permissions } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async deactivate(id: string, orgId: string) {
    const user = await this.userDal.get({
      identifierOptions: { id, org_id: orgId } as never,
    });

    if (!user) {
      throw new NotFoundException();
    }

    return this.userDal.update({
      identifierOptions: { id } as never,
      updatePayload: { status: UserStatus.ARCHIVED } as never,
      transactionOptions: { useTransaction: false },
    });
  }
}
