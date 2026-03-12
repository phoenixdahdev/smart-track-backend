import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateCorrectionRequestDto {
  @ApiProperty({ example: 'sr-uuid', description: 'UUID of the approved service record' })
  @IsUUID()
  @IsNotEmpty()
  service_record_id: string;

  @ApiProperty({ example: 'Units delivered should be 6 instead of 4' })
  @IsString()
  @IsNotEmpty()
  requested_changes: string;
}
