import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ClaimStatus } from '@enums/claim-status.enum';

export class TransitionClaimStatusDto {
  @ApiProperty({ description: 'Target status', enum: ClaimStatus })
  @IsEnum(ClaimStatus)
  @IsNotEmpty()
  status: ClaimStatus;

  @ApiPropertyOptional({ description: 'Reason for transition' })
  @IsString()
  @IsOptional()
  reason?: string;
}
