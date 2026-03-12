import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateServiceRecordDto {
  @ApiProperty({ example: 'individual-uuid', description: 'UUID of the individual receiving services' })
  @IsUUID()
  @IsNotEmpty()
  individual_id: string;

  @ApiPropertyOptional({ example: 'program-uuid', description: 'UUID of the program' })
  @IsUUID()
  @IsOptional()
  program_id?: string;

  @ApiProperty({ example: '2026-03-10', description: 'Service date in YYYY-MM-DD format' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'service_date must be YYYY-MM-DD' })
  service_date: string;

  @ApiPropertyOptional({ example: 'service-code-uuid', description: 'UUID of the service code' })
  @IsUUID()
  @IsOptional()
  service_code_id?: string;

  @ApiProperty({ example: 4.0, description: 'Number of units delivered' })
  @IsNumber()
  @IsPositive()
  units_delivered: number;
}
