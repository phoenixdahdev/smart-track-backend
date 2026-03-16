import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationValidator } from '@utils/pagination-utils';

export class PlatformAuditQueryDto extends PaginationValidator {
  @ApiPropertyOptional({ description: 'Filter by operator ID' })
  @IsUUID()
  @IsOptional()
  operator_id?: string;

  @ApiPropertyOptional({ description: 'Filter by action' })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional({ description: 'Filter by target type' })
  @IsString()
  @IsOptional()
  target_type?: string;

  @ApiPropertyOptional({ description: 'Filter from date' })
  @IsDateString()
  @IsOptional()
  date_from?: string;

  @ApiPropertyOptional({ description: 'Filter to date' })
  @IsDateString()
  @IsOptional()
  date_to?: string;
}
