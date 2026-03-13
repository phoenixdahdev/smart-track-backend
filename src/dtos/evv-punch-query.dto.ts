import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';
import { PaginationValidator } from '@utils/pagination-utils';
import { PunchType } from '@enums/punch-type.enum';

export class EvvPunchQueryDto extends PaginationValidator {
  @ApiPropertyOptional({ example: 'staff-uuid', description: 'Filter by staff member' })
  @IsUUID()
  @IsOptional()
  staff_id?: string;

  @ApiPropertyOptional({ example: 'individual-uuid', description: 'Filter by individual' })
  @IsUUID()
  @IsOptional()
  individual_id?: string;

  @ApiPropertyOptional({ example: '2026-03-01', description: 'Start date (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date_from must be YYYY-MM-DD' })
  @IsOptional()
  date_from?: string;

  @ApiPropertyOptional({ example: '2026-03-31', description: 'End date (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date_to must be YYYY-MM-DD' })
  @IsOptional()
  date_to?: string;

  @ApiPropertyOptional({ example: 'CLOCK_IN', enum: PunchType, description: 'Filter by punch type' })
  @IsEnum(PunchType)
  @IsOptional()
  punch_type?: PunchType;
}
