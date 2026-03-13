import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdatePayerConfigDto {
  @ApiPropertyOptional({ description: 'Payer name' })
  @IsString()
  @IsOptional()
  payer_name?: string;

  @ApiPropertyOptional({ description: 'EDI payer ID' })
  @IsString()
  @IsOptional()
  payer_id_edi?: string;

  @ApiPropertyOptional({ description: 'Clearinghouse routing config' })
  @IsObject()
  @IsOptional()
  clearinghouse_routing?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Additional payer configuration' })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}
