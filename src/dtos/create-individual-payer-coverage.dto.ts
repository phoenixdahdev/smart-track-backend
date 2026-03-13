import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

export class CreateIndividualPayerCoverageDto {
  @ApiProperty({ description: 'Individual UUID' })
  @IsUUID()
  @IsNotEmpty()
  individual_id: string;

  @ApiProperty({ description: 'Payer config UUID' })
  @IsUUID()
  @IsNotEmpty()
  payer_config_id: string;

  @ApiProperty({ description: 'Subscriber ID', example: 'SUB-12345' })
  @IsString()
  @IsNotEmpty()
  subscriber_id: string;

  @ApiPropertyOptional({ description: 'Member ID' })
  @IsString()
  @IsOptional()
  member_id?: string;

  @ApiPropertyOptional({ description: 'Group number' })
  @IsString()
  @IsOptional()
  group_number?: string;

  @ApiPropertyOptional({ description: 'Relationship to subscriber', example: 'SELF' })
  @IsString()
  @IsOptional()
  relationship?: string;

  @ApiProperty({ description: 'Coverage start date (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'coverage_start must be YYYY-MM-DD' })
  @IsNotEmpty()
  coverage_start: string;

  @ApiPropertyOptional({ description: 'Coverage end date (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'coverage_end must be YYYY-MM-DD' })
  @IsOptional()
  coverage_end?: string;

  @ApiPropertyOptional({ description: 'Priority (1 = primary)', example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  priority?: number;
}
