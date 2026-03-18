import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class ReportDateRangeQueryDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  date_from?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  date_to?: string;
}

export class ReportDateRangeWithStaffQueryDto extends ReportDateRangeQueryDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  staff_id?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  program_id?: string;
}

export class ReportDateRangeWithPayerQueryDto extends ReportDateRangeQueryDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  payer_config_id?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  individual_id?: string;
}

export class AuthorizationUsageQueryDto extends ReportDateRangeQueryDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  individual_id?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  payer_config_id?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  service_code_id?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  alerts_only?: boolean;
}
