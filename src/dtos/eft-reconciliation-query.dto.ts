import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class EftReconciliationQueryDto {
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
