import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateGlobalPayerDto {
  @ApiProperty({ description: 'Payer name' })
  @IsString()
  @IsNotEmpty()
  payer_name: string;

  @ApiProperty({ description: 'EDI payer ID' })
  @IsString()
  @IsNotEmpty()
  payer_id_edi: string;

  @ApiPropertyOptional({ description: 'State (2-letter code)' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'Program type' })
  @IsString()
  @IsOptional()
  program_type?: string;

  @ApiPropertyOptional({ description: 'Clearinghouse ID' })
  @IsString()
  @IsOptional()
  clearinghouse_id?: string;

  @ApiPropertyOptional({ description: 'Payer configuration' })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}
