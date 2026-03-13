import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationValidator } from '@utils/pagination-utils';
import { ClaimStatus } from '@enums/claim-status.enum';

export class ClaimQueryDto extends PaginationValidator {
  @ApiPropertyOptional({ description: 'Filter by status', enum: ClaimStatus })
  @IsEnum(ClaimStatus)
  @IsOptional()
  status?: ClaimStatus;

  @ApiPropertyOptional({ description: 'Filter by individual' })
  @IsUUID()
  @IsOptional()
  individual_id?: string;
}
