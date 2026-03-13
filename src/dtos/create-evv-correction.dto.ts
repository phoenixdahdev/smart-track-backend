import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PunchType } from '@enums/punch-type.enum';

export class CreateEvvCorrectionDto {
  @ApiProperty({ example: 'individual-uuid', description: 'UUID of the individual' })
  @IsUUID()
  @IsNotEmpty()
  individual_id: string;

  @ApiProperty({ example: 'CLOCK_IN', enum: PunchType, description: 'Type of punch being corrected' })
  @IsEnum(PunchType)
  @IsNotEmpty()
  punch_type: PunchType;

  @ApiProperty({ example: '2026-03-10T08:00:00.000Z', description: 'Requested correction time (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  requested_time: string;

  @ApiProperty({ example: 'Forgot to clock in at start of shift', description: 'Reason for correction' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ example: 'shift-uuid', description: 'UUID of the associated shift' })
  @IsUUID()
  @IsOptional()
  shift_id?: string;
}
