import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateIspGoalDto {
  @ApiProperty({ example: 'individual-uuid' })
  @IsUUID()
  @IsNotEmpty()
  individual_id: string;

  @ApiProperty({
    example: 'Increase independent meal preparation skills.',
    description: 'Goal description (stored encrypted)',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: '80% independence by end of quarter' })
  @IsString()
  @IsOptional()
  target?: string;

  @ApiProperty({ example: '2026-03-01' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'effective_start must be YYYY-MM-DD' })
  effective_start: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'effective_end must be YYYY-MM-DD' })
  @IsOptional()
  effective_end?: string;
}
