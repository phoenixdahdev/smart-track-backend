import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateServiceCodeDto {
  @ApiProperty({ description: 'UUID of the global service code to link' })
  @IsUUID()
  @IsNotEmpty()
  global_code_id: string;

  @ApiPropertyOptional({ description: 'Override code' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Override description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Modifiers' })
  @IsArray()
  @IsOptional()
  modifiers?: string[];

  @ApiPropertyOptional({ description: 'Unit of measure (e.g. HOUR, DAY)' })
  @IsString()
  @IsOptional()
  unit_of_measure?: string;
}
