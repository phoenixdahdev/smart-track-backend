import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class UpdateIndividualPayerCoverageDto {
  @ApiPropertyOptional({ description: 'Subscriber ID' })
  @IsString()
  @IsOptional()
  subscriber_id?: string;

  @ApiPropertyOptional({ description: 'Member ID' })
  @IsString()
  @IsOptional()
  member_id?: string;

  @ApiPropertyOptional({ description: 'Group number' })
  @IsString()
  @IsOptional()
  group_number?: string;

  @ApiPropertyOptional({ description: 'Relationship to subscriber' })
  @IsString()
  @IsOptional()
  relationship?: string;

  @ApiPropertyOptional({ description: 'Coverage end date (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'coverage_end must be YYYY-MM-DD' })
  @IsOptional()
  coverage_end?: string;

  @ApiPropertyOptional({ description: 'Priority' })
  @IsInt()
  @Min(1)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
