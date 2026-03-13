import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateClaimLineDto {
  @ApiPropertyOptional({ description: 'Procedure code' })
  @IsString()
  @IsOptional()
  procedure_code?: string;

  @ApiPropertyOptional({ description: 'Modifiers' })
  @IsArray()
  @IsOptional()
  modifiers?: string[];

  @ApiPropertyOptional({ description: 'Units billed' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  units_billed?: number;

  @ApiPropertyOptional({ description: 'Charge in cents' })
  @IsInt()
  @Min(0)
  @IsOptional()
  charge_cents?: number;

  @ApiPropertyOptional({ description: 'Rendering provider NPI' })
  @IsString()
  @IsOptional()
  rendering_provider_npi?: string;

  @ApiPropertyOptional({ description: 'Diagnosis pointer array' })
  @IsArray()
  @IsOptional()
  diagnosis_pointer?: number[];
}
