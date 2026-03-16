import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationValidator } from '@utils/pagination-utils';
import { NotificationType } from '@enums/notification-type.enum';

export class NotificationQueryDto extends PaginationValidator {
  @IsOptional()
  @IsEnum(NotificationType)
  @ApiPropertyOptional({ enum: NotificationType })
  type?: NotificationType;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @ApiPropertyOptional({ description: 'Filter by read status' })
  read?: boolean;
}
