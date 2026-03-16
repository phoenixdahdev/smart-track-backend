import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsIn,
  IsBoolean,
} from 'class-validator';

export class UpdateAdlCategoryDto {
  @ApiPropertyOptional({ example: 'Cooking & Meal Prep' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'IADL', enum: ['ADL', 'IADL'] })
  @IsString()
  @IsIn(['ADL', 'IADL'])
  @IsOptional()
  category_type?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @IsOptional()
  display_order?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
