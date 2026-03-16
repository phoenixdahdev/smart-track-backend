import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationValidator } from '@utils/pagination-utils';
import { RemittanceStatus } from '@enums/remittance-status.enum';

export class RemittanceQueryDto extends PaginationValidator {
  @ApiPropertyOptional({ enum: RemittanceStatus })
  @IsEnum(RemittanceStatus)
  @IsOptional()
  status?: RemittanceStatus;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  date_from?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  date_to?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  payer_config_id?: string;
}
