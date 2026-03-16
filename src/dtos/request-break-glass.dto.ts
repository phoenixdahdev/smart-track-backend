import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RequestBreakGlassDto {
  @ApiProperty({ description: 'Target organization ID' })
  @IsUUID()
  @IsNotEmpty()
  org_id: string;

  @ApiProperty({ description: 'Support ticket ID' })
  @IsString()
  @IsNotEmpty()
  ticket_id: string;

  @ApiProperty({ description: 'Reason for break-glass access' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Data scope (e.g., READ_ONLY, FULL_ACCESS)' })
  @IsString()
  @IsNotEmpty()
  data_scope: string;
}
