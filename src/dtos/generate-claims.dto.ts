import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class GenerateClaimsDto {
  @ApiProperty({ description: 'Service record UUIDs to generate claims for', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  service_record_ids: string[];
}
