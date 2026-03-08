import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProgramDto {
  @ApiProperty({ example: 'Residential Support Services' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'RESIDENTIAL',
    description: 'Program type (e.g. RESIDENTIAL, DAY_HABILITATION)',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    example: 'Provides 24-hour residential support to individuals with IDD.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
