import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';
import { PaginationValidator } from '@utils/pagination-utils';

export class BillingQueueQueryDto extends PaginationValidator {
  @ApiPropertyOptional({ description: 'Filter by date from (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date_from must be YYYY-MM-DD' })
  @IsOptional()
  date_from?: string;

  @ApiPropertyOptional({ description: 'Filter by date to (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date_to must be YYYY-MM-DD' })
  @IsOptional()
  date_to?: string;

  @ApiPropertyOptional({ description: 'Filter by individual' })
  @IsUUID()
  @IsOptional()
  individual_id?: string;

  @ApiPropertyOptional({ description: 'Filter by program' })
  @IsUUID()
  @IsOptional()
  program_id?: string;
}
