import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationValidator } from '@utils/pagination-utils';

export class GlobalPayerQueryDto extends PaginationValidator {
  @ApiPropertyOptional({ description: 'Filter by state' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  active?: boolean;
}
