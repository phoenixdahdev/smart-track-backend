import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateGlobalPayerDto {
  @ApiPropertyOptional({ description: 'Payer name' })
  @IsString()
  @IsOptional()
  payer_name?: string;

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

  @ApiPropertyOptional({ description: 'Active status' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Payer configuration' })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}
