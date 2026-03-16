import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class TriggerAuthThresholdCheckDto {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Check single authorization (or all if omitted)' })
  authorization_id?: string;
}
