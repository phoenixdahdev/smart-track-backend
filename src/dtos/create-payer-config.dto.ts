import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePayerConfigDto {
  @ApiProperty({ description: 'UUID of the global payer to link' })
  @IsUUID()
  @IsNotEmpty()
  global_payer_id: string;

  @ApiPropertyOptional({ description: 'Override payer name' })
  @IsString()
  @IsOptional()
  payer_name?: string;

  @ApiPropertyOptional({ description: 'Override EDI payer ID' })
  @IsString()
  @IsOptional()
  payer_id_edi?: string;

  @ApiPropertyOptional({ description: 'Clearinghouse routing config' })
  @IsObject()
  @IsOptional()
  clearinghouse_routing?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional payer configuration' })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}
