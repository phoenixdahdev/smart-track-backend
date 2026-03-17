import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { PaginationValidator } from '@utils/pagination-utils';
import { IncidentStatus } from '@enums/incident-status.enum';

export class PortalIncidentQueryDto extends PaginationValidator {
  @IsOptional()
  @IsEnum(IncidentStatus)
  @ApiPropertyOptional({ description: 'Filter by status', enum: IncidentStatus })
  status?: IncidentStatus;
}
