import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateDailyNoteDto {
  @ApiPropertyOptional({
    example: 'Updated note content.',
    description: 'Note content (stored encrypted)',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    example: 'Updated observations.',
    description: 'Observations (stored encrypted)',
  })
  @IsString()
  @IsOptional()
  observations?: string;
}
