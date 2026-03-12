import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class UpdateBehaviorPlanDto {
  @ApiPropertyOptional({ example: 'Updated plan content.', description: 'Stored encrypted' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'end_date must be YYYY-MM-DD' })
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
