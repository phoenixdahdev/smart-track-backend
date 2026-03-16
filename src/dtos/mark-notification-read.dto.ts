import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class MarkNotificationReadDto {
  @IsBoolean()
  @ApiProperty({ description: 'Read status', example: true })
  read: boolean;
}
