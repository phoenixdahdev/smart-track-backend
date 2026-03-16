import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationValidator } from '@utils/pagination-utils';

export class PaymentPostQueryDto extends PaginationValidator {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  remittance_id?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  claim_id?: string;

  @ApiPropertyOptional({ description: 'If "true", show only unmatched posts' })
  @IsOptional()
  unmatched_only?: string;
}
