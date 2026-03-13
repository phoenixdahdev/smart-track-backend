import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AppealClaimDto {
  @ApiProperty({ description: 'Reason for appeal' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
