import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TriggerReviewReminderDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Hours threshold for overdue (default 48)', example: 48 })
  overdue_hours?: number;
}
