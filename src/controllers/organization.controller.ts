import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { OrganizationService } from '@services/organization.service';
import { CreateOrganizationDto } from '@dtos/create-organization.dto';
import { UpdateOrganizationDto } from '@dtos/update-organization.dto';
import { CurrentUser } from '@decorators/current-user.decorator';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  async create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser('id') userId: string,
  ) {
    const org = await this.organizationService.create(dto, userId);
    return {
      message: 'Organization created successfully',
      data: org,
    };
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const org = await this.organizationService.findById(id);
    return {
      message: 'Organization retrieved',
      data: org,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    const org = await this.organizationService.update(id, dto);
    return {
      message: 'Organization updated',
      data: org,
    };
  }
}
