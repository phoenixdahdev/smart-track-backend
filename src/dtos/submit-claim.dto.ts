import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class SubmitBatchClaimsDto {
  @ApiProperty({ description: 'Claim UUIDs to submit', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  claim_ids: string[];
}
