import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateStaffAssignmentDto {
  @ApiProperty({ example: 'staff-user-uuid' })
  @IsUUID()
  staff_id: string;

  @ApiProperty({ example: 'individual-uuid' })
  @IsUUID()
  individual_id: string;

  @ApiProperty({ example: 'program-uuid' })
  @IsUUID()
  program_id: string;

  @ApiProperty({
    example: '2026-01-01',
    description: 'Effective date of the assignment (YYYY-MM-DD)',
  })
  @IsDateString()
  effective_date: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'End date of the assignment (YYYY-MM-DD); null = ongoing',
  })
  @IsDateString()
  @IsOptional()
  end_date?: string;
}
