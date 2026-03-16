import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateGlobalServiceCodeDto {
  @ApiProperty({ description: 'Service code (e.g., H2015)' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Code description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Code type (e.g., HCPCS, CPT)' })
  @IsString()
  @IsNotEmpty()
  code_type: string;

  @ApiProperty({ description: 'Valid US states', type: [String] })
  @IsArray()
  @IsString({ each: true })
  valid_states: string[];

  @ApiProperty({ description: 'Billing unit (e.g., 15MIN, HOUR, DAY)' })
  @IsString()
  @IsNotEmpty()
  billing_unit: string;
}
