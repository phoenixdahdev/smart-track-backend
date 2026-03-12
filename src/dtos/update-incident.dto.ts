import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateIncidentDto {
  @ApiPropertyOptional({ example: 'MEDICAL' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'Updated description.', description: 'Stored encrypted' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Updated action.', description: 'Stored encrypted' })
  @IsString()
  @IsOptional()
  immediate_action?: string;
}
