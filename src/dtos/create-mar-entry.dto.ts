import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { MarResult } from '@enums/mar-result.enum';

export class CreateMarEntryDto {
  @ApiProperty({ example: 'individual-uuid' })
  @IsUUID()
  @IsNotEmpty()
  individual_id: string;

  @ApiProperty({
    example: 'Risperidone',
    description: 'Medication name (stored encrypted)',
  })
  @IsString()
  @IsNotEmpty()
  drug_name: string;

  @ApiProperty({
    example: '0.5mg',
    description: 'Dosage (stored encrypted)',
  })
  @IsString()
  @IsNotEmpty()
  dose: string;

  @ApiPropertyOptional({
    example: 'oral',
    description: 'Route of administration (stored encrypted)',
  })
  @IsString()
  @IsOptional()
  route?: string;

  @ApiProperty({ example: '2026-03-10T08:00:00.000Z' })
  @IsString()
  @IsNotEmpty()
  scheduled_time: string;

  @ApiPropertyOptional({ example: '2026-03-10T08:05:00.000Z' })
  @IsString()
  @IsOptional()
  administered_time?: string;

  @ApiProperty({ enum: MarResult, example: MarResult.GIVEN })
  @IsEnum(MarResult)
  result: MarResult;

  @ApiPropertyOptional({ example: 'Taken with breakfast' })
  @IsString()
  @IsOptional()
  notes?: string;
}
