import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class UpdateStaffAssignmentDto {
  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'End date (YYYY-MM-DD). Pass today to end the assignment.',
  })
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
