import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ManualMatchDto {
  @ApiProperty({ description: 'Claim UUID to match this payment post to' })
  @IsUUID()
  claim_id: string;
}
