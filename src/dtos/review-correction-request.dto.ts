import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReviewCorrectionRequestDto {
  @ApiPropertyOptional({ example: 'Correction approved, will be reflected in next billing cycle.' })
  @IsString()
  @IsOptional()
  reviewer_notes?: string;
}
