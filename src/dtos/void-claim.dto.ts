import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VoidClaimDto {
  @ApiProperty({ description: 'Reason for voiding' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
