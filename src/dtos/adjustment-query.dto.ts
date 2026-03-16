import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationValidator } from '@utils/pagination-utils';

export class AdjustmentQueryDto extends PaginationValidator {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  claim_id?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  payment_post_id?: string;
}
