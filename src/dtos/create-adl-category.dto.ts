import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsIn } from 'class-validator';

export class CreateAdlCategoryDto {
  @ApiProperty({ example: 'Cooking', description: 'ADL category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Ability to prepare meals independently',
    description: 'Category description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'IADL',
    description: 'Category type: ADL or IADL',
    enum: ['ADL', 'IADL'],
  })
  @IsString()
  @IsIn(['ADL', 'IADL'])
  category_type: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Display order for UI sorting',
  })
  @IsInt()
  @IsOptional()
  display_order?: number;
}
