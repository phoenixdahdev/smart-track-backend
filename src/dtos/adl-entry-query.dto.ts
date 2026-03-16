import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsInt, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdlEntryQueryDto {
  @ApiPropertyOptional({ example: 'uuid' })
  @IsUUID()
  @IsOptional()
  individual_id?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsUUID()
  @IsOptional()
  adl_category_id?: string;

  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date_from must be YYYY-MM-DD' })
  @IsOptional()
  date_from?: string;

  @ApiPropertyOptional({ example: '2026-03-31' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date_to must be YYYY-MM-DD' })
  @IsOptional()
  date_to?: string;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}
