import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateBehaviorPlanDto {
  @ApiProperty({ example: 'individual-uuid' })
  @IsUUID()
  @IsNotEmpty()
  individual_id: string;

  @ApiProperty({
    example: 'Behavior intervention plan for community integration...',
    description: 'Plan content (stored encrypted)',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: '2026-03-01' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'effective_date must be YYYY-MM-DD' })
  effective_date: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'end_date must be YYYY-MM-DD' })
  @IsOptional()
  end_date?: string;
}
