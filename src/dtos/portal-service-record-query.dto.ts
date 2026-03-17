import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { PaginationValidator } from '@utils/pagination-utils';
import { ServiceRecordStatus } from '@enums/service-record-status.enum';

export class PortalServiceRecordQueryDto extends PaginationValidator {
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Filter from date (YYYY-MM-DD)' })
  from_date?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Filter to date (YYYY-MM-DD)' })
  to_date?: string;

  @IsOptional()
  @IsEnum(ServiceRecordStatus)
  @ApiPropertyOptional({ description: 'Filter by status', enum: ServiceRecordStatus })
  status?: ServiceRecordStatus;
}
