import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationDal } from '@dals/organization.dal';
import { UserDal } from '@dals/user.dal';
import { OrgStatus } from '@enums/org-status.enum';
import { AgencyRole } from '@enums/role.enum';
import { type CreateOrganizationDto } from '@dtos/create-organization.dto';
import { type UpdateOrganizationDto } from '@dtos/update-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationDal: OrganizationDal,
    private readonly userDal: UserDal,
  ) {}

  async create(dto: CreateOrganizationDto, userId: string) {
    const existingNpi = await this.organizationDal.get({
      identifierOptions: { npi: dto.npi },
    });
    if (existingNpi) {
      throw new BadRequestException('An organization with this NPI already exists');
    }

    const org = await this.organizationDal.create({
      createPayload: {
        legal_name: dto.legal_name,
        dba: dto.dba ?? null,
        npi: dto.npi,
        ein: dto.ein,
        status: OrgStatus.ACTIVE,
        address_line1: dto.address_line1 ?? null,
        address_line2: dto.address_line2 ?? null,
        city: dto.city ?? null,
        state: dto.state ?? null,
        zip: dto.zip ?? null,
        phone: dto.phone ?? null,
      },
      transactionOptions: { useTransaction: false },
    });

    await this.userDal.update({
      identifierOptions: { id: userId },
      updatePayload: {
        org_id: org.id,
        role: AgencyRole.AGENCY_OWNER,
      },
      transactionOptions: { useTransaction: false },
    });

    return org;
  }

  async findById(id: string) {
    const org = await this.organizationDal.get({
      identifierOptions: { id },
    });

    if (!org) {
      throw new NotFoundException();
    }

    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const org = await this.organizationDal.get({
      identifierOptions: { id },
    });

    if (!org) {
      throw new NotFoundException();
    }

    return this.organizationDal.update({
      identifierOptions: { id },
      updatePayload: dto,
      transactionOptions: { useTransaction: false },
    });
  }
}
