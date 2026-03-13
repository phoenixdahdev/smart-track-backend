import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateShiftDto {
  @ApiProperty({ example: 'staff-uuid', description: 'UUID of the staff member' })
  @IsUUID()
  @IsNotEmpty()
  staff_id: string;

  @ApiProperty({ example: 'individual-uuid', description: 'UUID of the individual' })
  @IsUUID()
  @IsNotEmpty()
  individual_id: string;

  @ApiPropertyOptional({ example: 'site-uuid', description: 'UUID of the site' })
  @IsUUID()
  @IsOptional()
  site_id?: string;

  @ApiPropertyOptional({ example: 'program-uuid', description: 'UUID of the program' })
  @IsUUID()
  @IsOptional()
  program_id?: string;

  @ApiProperty({ example: '2026-03-15', description: 'Shift date (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'shift_date must be YYYY-MM-DD' })
  @IsNotEmpty()
  shift_date: string;

  @ApiProperty({ example: '08:00', description: 'Start time (HH:MM)' })
  @Matches(/^\d{2}:\d{2}$/, { message: 'start_time must be HH:MM' })
  @IsNotEmpty()
  start_time: string;

  @ApiProperty({ example: '16:00', description: 'End time (HH:MM)' })
  @Matches(/^\d{2}:\d{2}$/, { message: 'end_time must be HH:MM' })
  @IsNotEmpty()
  end_time: string;
}
