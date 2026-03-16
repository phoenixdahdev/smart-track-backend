import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { NotificationType } from '@enums/notification-type.enum';

export class MarkAllNotificationsReadDto {
  @IsOptional()
  @IsEnum(NotificationType)
  @ApiPropertyOptional({ enum: NotificationType, description: 'Optional type filter' })
  type?: NotificationType;
}
