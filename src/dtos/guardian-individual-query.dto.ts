import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationValidator } from '@utils/pagination-utils';

export class GuardianIndividualQueryDto extends PaginationValidator {
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter to active links only' })
  @Transform(({ value }) => value === 'true')
  active_only?: boolean;
}
