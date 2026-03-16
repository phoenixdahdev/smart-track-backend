import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateGlobalServiceCodeDto {
  @ApiPropertyOptional({ description: 'Code description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Code type' })
  @IsString()
  @IsOptional()
  code_type?: string;

  @ApiPropertyOptional({ description: 'Valid US states', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  valid_states?: string[];

  @ApiPropertyOptional({ description: 'Billing unit' })
  @IsString()
  @IsOptional()
  billing_unit?: string;

  @ApiPropertyOptional({ description: 'Status (ACTIVE or DEPRECATED)' })
  @IsString()
  @IsOptional()
  status?: string;
}
