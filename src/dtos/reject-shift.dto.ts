import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectShiftDto {
  @ApiPropertyOptional({ example: 'Scheduling conflict with another appointment', description: 'Reason for rejection' })
  @IsString()
  @IsOptional()
  reason?: string;
}
