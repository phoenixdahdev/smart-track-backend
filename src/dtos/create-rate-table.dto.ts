import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

export class CreateRateTableDto {
  @ApiProperty({ description: 'Payer config UUID' })
  @IsUUID()
  @IsNotEmpty()
  payer_config_id: string;

  @ApiProperty({ description: 'Service code UUID' })
  @IsUUID()
  @IsNotEmpty()
  service_code_id: string;

  @ApiProperty({ description: 'Rate in cents', example: 15099 })
  @IsInt()
  @Min(0)
  rate_cents: number;

  @ApiProperty({ description: 'Effective date (YYYY-MM-DD)', example: '2026-01-01' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'effective_date must be YYYY-MM-DD' })
  @IsNotEmpty()
  effective_date: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)', example: '2026-12-31' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'end_date must be YYYY-MM-DD' })
  @IsOptional()
  end_date?: string;
}
