import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationValidator } from '@utils/pagination-utils';
import { OrgStatus } from '@enums/org-status.enum';

export class OrgManagementQueryDto extends PaginationValidator {
  @ApiPropertyOptional({ description: 'Filter by status', enum: OrgStatus })
  @IsEnum(OrgStatus)
  @IsOptional()
  status?: OrgStatus;

  @ApiPropertyOptional({ description: 'Filter by plan tier' })
  @IsString()
  @IsOptional()
  plan_tier?: string;

  @ApiPropertyOptional({ description: 'Filter by state' })
  @IsString()
  @IsOptional()
  state?: string;
}
