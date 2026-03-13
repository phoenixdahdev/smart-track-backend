import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReviewEvvCorrectionDto {
  @ApiPropertyOptional({ example: 'Correction approved per supervisor review.' })
  @IsString()
  @IsOptional()
  reviewer_notes?: string;
}
