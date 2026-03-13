import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class LinkEvvServiceRecordDto {
  @ApiProperty({ example: 'punch-in-uuid', description: 'UUID of the clock-in punch' })
  @IsUUID()
  @IsNotEmpty()
  evv_punch_in_id: string;

  @ApiProperty({ example: 'punch-out-uuid', description: 'UUID of the clock-out punch' })
  @IsUUID()
  @IsNotEmpty()
  evv_punch_out_id: string;
}
