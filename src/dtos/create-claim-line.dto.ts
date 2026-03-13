import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

export class CreateClaimLineDto {
  @ApiProperty({ description: 'Service code UUID' })
  @IsUUID()
  @IsNotEmpty()
  service_code_id: string;

  @ApiProperty({ description: 'Procedure code', example: 'H2015' })
  @IsString()
  @IsNotEmpty()
  procedure_code: string;

  @ApiPropertyOptional({ description: 'Modifiers' })
  @IsArray()
  @IsOptional()
  modifiers?: string[];

  @ApiProperty({ description: 'Service date (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'service_date must be YYYY-MM-DD' })
  @IsNotEmpty()
  service_date: string;

  @ApiProperty({ description: 'Units billed', example: 4 })
  @IsNumber()
  @Min(0)
  units_billed: number;

  @ApiProperty({ description: 'Charge in cents', example: 6000 })
  @IsInt()
  @Min(0)
  charge_cents: number;

  @ApiPropertyOptional({ description: 'Rendering provider NPI' })
  @IsString()
  @IsOptional()
  rendering_provider_npi?: string;

  @ApiPropertyOptional({ description: 'Place of service code' })
  @IsString()
  @IsOptional()
  place_of_service?: string;

  @ApiPropertyOptional({ description: 'Diagnosis pointer array' })
  @IsArray()
  @IsOptional()
  diagnosis_pointer?: number[];
}
