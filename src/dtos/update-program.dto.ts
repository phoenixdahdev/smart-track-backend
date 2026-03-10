import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateProgramDto {
  @ApiPropertyOptional({ example: 'Community Living Support' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'COMMUNITY' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'Updated program description.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
