import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateEvvPunchDto {
  @ApiProperty({ example: 'individual-uuid', description: 'UUID of the individual' })
  @IsUUID()
  @IsNotEmpty()
  individual_id: string;

  @ApiPropertyOptional({ example: 'shift-uuid', description: 'UUID of the associated shift' })
  @IsUUID()
  @IsOptional()
  shift_id?: string;

  @ApiPropertyOptional({ example: 40.7128, description: 'GPS latitude (-90 to 90)' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  gps_latitude?: number;

  @ApiPropertyOptional({ example: -74.006, description: 'GPS longitude (-180 to 180)' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  gps_longitude?: number;

  @ApiPropertyOptional({ example: 'device-abc-123', description: 'Device identifier' })
  @IsString()
  @IsOptional()
  device_id?: string;

  @ApiPropertyOptional({ example: 'Starting shift for individual care', description: 'Optional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
