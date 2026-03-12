import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class UpdateServiceRecordDto {
  @ApiPropertyOptional({ example: 'program-uuid' })
  @IsUUID()
  @IsOptional()
  program_id?: string;

  @ApiPropertyOptional({ example: '2026-03-10' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'service_date must be YYYY-MM-DD' })
  @IsOptional()
  service_date?: string;

  @ApiPropertyOptional({ example: 'service-code-uuid' })
  @IsUUID()
  @IsOptional()
  service_code_id?: string;

  @ApiPropertyOptional({ example: 4.0 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  units_delivered?: number;
}
