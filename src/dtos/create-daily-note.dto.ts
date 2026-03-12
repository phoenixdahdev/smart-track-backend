import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDailyNoteDto {
  @ApiProperty({
    example: 'Assisted individual with morning routine and breakfast preparation.',
    description: 'Note content (stored encrypted)',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    example: 'Individual showed improved independence today.',
    description: 'Observations (stored encrypted)',
  })
  @IsString()
  @IsOptional()
  observations?: string;
}
