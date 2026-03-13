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

export class FlagMissedPunchDto {
  @ApiProperty({ example: 'staff-uuid', description: 'UUID of the staff member' })
  @IsUUID()
  @IsNotEmpty()
  staff_id: string;

  @ApiProperty({ example: 'individual-uuid', description: 'UUID of the individual' })
  @IsUUID()
  @IsNotEmpty()
  individual_id: string;

  @ApiProperty({ example: 'CLOCK_OUT', enum: PunchType, description: 'Type of missed punch' })
  @IsEnum(PunchType)
  @IsNotEmpty()
  punch_type: PunchType;

  @ApiProperty({ example: '2026-03-10T17:00:00.000Z', description: 'Requested punch time (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  requested_time: string;

  @ApiProperty({ example: 'Staff forgot to clock out', description: 'Reason for flagging' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ example: 'shift-uuid', description: 'UUID of the associated shift' })
  @IsUUID()
  @IsOptional()
  shift_id?: string;
}
