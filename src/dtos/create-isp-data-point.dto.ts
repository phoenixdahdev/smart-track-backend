import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateIspDataPointDto {
  @ApiProperty({ example: 'goal-uuid' })
  @IsUUID()
  @IsNotEmpty()
  goal_id: string;

  @ApiPropertyOptional({ example: 'sr-uuid', description: 'Link to a specific service record' })
  @IsUUID()
  @IsOptional()
  service_record_id?: string;

  @ApiProperty({ example: '75', description: 'Measured value or observation' })
  @IsString()
  @IsNotEmpty()
  value: string;
}
