import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateIncidentDto {
  @ApiProperty({ example: 'individual-uuid' })
  @IsUUID()
  @IsNotEmpty()
  individual_id: string;

  @ApiProperty({ example: 'BEHAVIORAL', description: 'Incident type category' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    example: 'Individual became agitated during community outing.',
    description: 'Incident description (stored encrypted)',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    example: 'Removed individual from the situation and used de-escalation techniques.',
    description: 'Immediate action taken (stored encrypted)',
  })
  @IsString()
  @IsOptional()
  immediate_action?: string;

  @ApiProperty({ example: '2026-03-10T14:30:00.000Z', description: 'When the incident occurred' })
  @IsString()
  @IsNotEmpty()
  occurred_at: string;
}
