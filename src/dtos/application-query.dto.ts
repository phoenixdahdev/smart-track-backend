import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationValidator } from '@utils/pagination-utils';
import { ApplicationStatus } from '@enums/application-status.enum';

export class ApplicationQueryDto extends PaginationValidator {
  @ApiPropertyOptional({ description: 'Filter by status', enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Filter by plan tier' })
  @IsString()
  @IsOptional()
  plan_tier?: string;

  @ApiPropertyOptional({ description: 'Filter from date' })
  @IsDateString()
  @IsOptional()
  date_from?: string;

  @ApiPropertyOptional({ description: 'Filter to date' })
  @IsDateString()
  @IsOptional()
  date_to?: string;

  @ApiPropertyOptional({ description: 'Filter by reviewer' })
  @IsUUID()
  @IsOptional()
  reviewed_by?: string;
}
