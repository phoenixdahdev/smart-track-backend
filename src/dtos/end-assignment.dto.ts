import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class EndAssignmentDto {
  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  end_date: string;
}
