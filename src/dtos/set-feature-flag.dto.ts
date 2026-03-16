import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SetFeatureFlagDto {
  @ApiProperty({ description: 'Flag name' })
  @IsString()
  @IsNotEmpty()
  flag_name: string;

  @ApiProperty({ description: 'Flag value (any JSON value)' })
  @IsNotEmpty()
  value: unknown;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
