import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';
import { UnitType } from '@enums/unit-type.enum';

export class CreateServiceAuthorizationDto {
  @ApiProperty({ description: 'Individual UUID' })
  @IsUUID()
  @IsNotEmpty()
  individual_id: string;

  @ApiProperty({ description: 'Payer config UUID' })
  @IsUUID()
  @IsNotEmpty()
  payer_config_id: string;

  @ApiProperty({ description: 'Service code UUID' })
  @IsUUID()
  @IsNotEmpty()
  service_code_id: string;

  @ApiProperty({ description: 'Authorization number', example: 'AUTH-2026-001' })
  @IsString()
  @IsNotEmpty()
  auth_number: string;

  @ApiProperty({ description: 'Units authorized', example: 120 })
  @IsNumber()
  @Min(0)
  units_authorized: number;

  @ApiProperty({ description: 'Unit type', enum: UnitType })
  @IsEnum(UnitType)
  unit_type: UnitType;

  @ApiProperty({ description: 'Start date (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'start_date must be YYYY-MM-DD' })
  @IsNotEmpty()
  start_date: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'end_date must be YYYY-MM-DD' })
  @IsNotEmpty()
  end_date: string;

  @ApiPropertyOptional({ description: 'Rendering provider NPI' })
  @IsString()
  @IsOptional()
  rendering_provider_npi?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
