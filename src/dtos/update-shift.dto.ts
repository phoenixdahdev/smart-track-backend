import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';

export class UpdateShiftDto {
  @ApiPropertyOptional({ example: 'staff-uuid', description: 'UUID of the staff member' })
  @IsUUID()
  @IsOptional()
  staff_id?: string;

  @ApiPropertyOptional({ example: 'individual-uuid', description: 'UUID of the individual' })
  @IsUUID()
  @IsOptional()
  individual_id?: string;

  @ApiPropertyOptional({ example: 'site-uuid', description: 'UUID of the site' })
  @IsUUID()
  @IsOptional()
  site_id?: string;

  @ApiPropertyOptional({ example: 'program-uuid', description: 'UUID of the program' })
  @IsUUID()
  @IsOptional()
  program_id?: string;

  @ApiPropertyOptional({ example: '2026-03-15', description: 'Shift date (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'shift_date must be YYYY-MM-DD' })
  @IsOptional()
  shift_date?: string;

  @ApiPropertyOptional({ example: '08:00', description: 'Start time (HH:MM)' })
  @Matches(/^\d{2}:\d{2}$/, { message: 'start_time must be HH:MM' })
  @IsOptional()
  start_time?: string;

  @ApiPropertyOptional({ example: '16:00', description: 'End time (HH:MM)' })
  @Matches(/^\d{2}:\d{2}$/, { message: 'end_time must be HH:MM' })
  @IsOptional()
  end_time?: string;
}
