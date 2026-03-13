import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class UpdateServiceAuthorizationDto {
  @ApiPropertyOptional({ description: 'Units authorized' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  units_authorized?: number;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'end_date must be YYYY-MM-DD' })
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Rendering provider NPI' })
  @IsString()
  @IsOptional()
  rendering_provider_npi?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
