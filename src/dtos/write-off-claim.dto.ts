import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class WriteOffClaimDto {
  @ApiProperty({ description: 'Reason for write-off' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
