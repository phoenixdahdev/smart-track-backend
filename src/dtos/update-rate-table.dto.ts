import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  Matches,
  Min,
} from 'class-validator';

export class UpdateRateTableDto {
  @ApiPropertyOptional({ description: 'Rate in cents' })
  @IsInt()
  @Min(0)
  @IsOptional()
  rate_cents?: number;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'end_date must be YYYY-MM-DD' })
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
