import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class RecordClaimResponseDto {
  @ApiProperty({ description: 'Response status (ACCEPTED or REJECTED)' })
  @IsString()
  @IsNotEmpty()
  response_status: string;

  @ApiProperty({ description: 'Response details from clearinghouse' })
  @IsObject()
  response_details: Record<string, any>;
}
