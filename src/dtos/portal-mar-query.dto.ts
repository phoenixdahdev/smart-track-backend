import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';
import { PaginationValidator } from '@utils/pagination-utils';

export class PortalMarQueryDto extends PaginationValidator {
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Filter from date (YYYY-MM-DD)' })
  from_date?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Filter to date (YYYY-MM-DD)' })
  to_date?: string;
}
