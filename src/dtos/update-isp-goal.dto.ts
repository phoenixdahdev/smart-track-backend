import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class UpdateIspGoalDto {
  @ApiPropertyOptional({ example: 'Updated goal description.', description: 'Stored encrypted' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '90% independence' })
  @IsString()
  @IsOptional()
  target?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'effective_end must be YYYY-MM-DD' })
  @IsOptional()
  effective_end?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
