import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationValidator } from '@utils/pagination-utils';

export class GlobalServiceCodeQueryDto extends PaginationValidator {
  @ApiPropertyOptional({ description: 'Filter by code type' })
  @IsString()
  @IsOptional()
  code_type?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsString()
  @IsOptional()
  status?: string;
}
