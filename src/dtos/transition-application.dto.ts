import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from '@enums/application-status.enum';

export class TransitionApplicationDto {
  @ApiProperty({ description: 'Target status', enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  @IsNotEmpty()
  status: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Reason for transition' })
  @IsString()
  @IsOptional()
  reason?: string;
}
