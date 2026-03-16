import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsObject } from 'class-validator';

export class UpdateNotificationPreferenceDto {
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Enable email notifications' })
  email_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Enable SMS notifications' })
  sms_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Enable in-app notifications' })
  in_app_enabled?: boolean;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({
    description: 'Per-type preference overrides',
    example: { AUTH_THRESHOLD: true, CLAIM_STATUS: false },
  })
  preferences?: Record<string, boolean>;
}
