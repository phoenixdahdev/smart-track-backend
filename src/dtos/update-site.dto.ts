import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export class UpdateSiteDto {
  @ApiPropertyOptional({ example: 'program-uuid' })
  @IsUUID()
  @IsOptional()
  program_id?: string;

  @ApiPropertyOptional({ example: 'Sunrise House — East Wing' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '456 Elm Street' })
  @IsString()
  @IsOptional()
  address_line1?: string;

  @ApiPropertyOptional({ example: 'Suite 200' })
  @IsString()
  @IsOptional()
  address_line2?: string;

  @ApiPropertyOptional({ example: 'Houston' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'TX' })
  @IsString()
  @Length(2, 2)
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '77001' })
  @IsString()
  @IsOptional()
  zip?: string;

  @ApiPropertyOptional({ example: 29.7604 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: -95.3698 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
