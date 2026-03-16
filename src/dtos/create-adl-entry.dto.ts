import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { AssistanceLevel } from '@enums/assistance-level.enum';

export class CreateAdlEntryDto {
  @ApiProperty({ example: 'uuid', description: 'Service record ID' })
  @IsUUID()
  @IsNotEmpty()
  service_record_id: string;

  @ApiProperty({ example: 'uuid', description: 'Individual ID' })
  @IsUUID()
  @IsNotEmpty()
  individual_id: string;

  @ApiProperty({ example: 'uuid', description: 'ADL category ID' })
  @IsUUID()
  @IsNotEmpty()
  adl_category_id: string;

  @ApiProperty({
    example: 'VERBAL_PROMPT',
    description: 'Level of assistance provided',
    enum: AssistanceLevel,
  })
  @IsEnum(AssistanceLevel)
  assistance_level: AssistanceLevel;

  @ApiPropertyOptional({
    example: 'Individual needed verbal reminders for sequencing steps.',
    description: 'Optional notes (stored encrypted)',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
