import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateSiteDto {
  @ApiProperty({ example: 'program-uuid' })
  @IsUUID()
  program_id: string;

  @ApiProperty({ example: 'Sunrise House — Main Campus' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '123 Oak Street' })
  @IsString()
  @IsNotEmpty()
  address_line1: string;

  @ApiPropertyOptional({ example: 'Suite 101' })
  @IsString()
  @IsOptional()
  address_line2?: string;

  @ApiProperty({ example: 'Austin' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'TX', description: '2-letter state code' })
  @IsString()
  @Length(2, 2)
  state: string;

  @ApiProperty({ example: '78701' })
  @IsString()
  @IsNotEmpty()
  zip: string;

  @ApiPropertyOptional({ example: 30.2672 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: -97.7431 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
