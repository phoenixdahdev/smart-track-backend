import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AssistanceLevel } from '@enums/assistance-level.enum';

export class UpdateAdlEntryDto {
  @ApiPropertyOptional({
    example: 'SUPERVISED',
    description: 'Updated assistance level',
    enum: AssistanceLevel,
  })
  @IsEnum(AssistanceLevel)
  @IsOptional()
  assistance_level?: AssistanceLevel;

  @ApiPropertyOptional({
    example: 'Updated observation notes.',
    description: 'Updated notes (stored encrypted)',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
