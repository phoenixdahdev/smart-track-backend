import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ArReportQueryDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  payer_config_id?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  individual_id?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  as_of_date?: string;
}
