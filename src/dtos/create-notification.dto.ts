import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { NotificationType } from '@enums/notification-type.enum';

export class CreateNotificationDto {
  @IsUUID()
  @ApiProperty({ description: 'Target user ID' })
  user_id: string;

  @IsEnum(NotificationType)
  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ description: 'Notification title (no PHI)', maxLength: 255 })
  title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Notification message (no PHI)' })
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional({ description: 'Entity type for linking', maxLength: 100 })
  entity_type?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Entity ID for linking' })
  entity_id?: string;
}
