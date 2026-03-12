import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectServiceRecordDto {
  @ApiPropertyOptional({ example: 'Missing required documentation for this service date' })
  @IsString()
  rejection_reason: string;
}

export class ApproveServiceRecordDto {
  @ApiPropertyOptional({ example: 'Looks good, approved.' })
  @IsString()
  @IsOptional()
  notes?: string;
}
