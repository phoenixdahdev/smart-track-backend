import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EraAdjustmentDto {
  @ApiProperty({ example: 'CO' })
  @IsString()
  @IsNotEmpty()
  group_code: string;

  @ApiProperty({ example: '45' })
  @IsString()
  @IsNotEmpty()
  reason_code: string;

  @ApiProperty({ example: 2500 })
  @IsInt()
  @Min(0)
  amount_cents: number;
}

export class EraClaimPaymentDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  claim_id?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  payer_claim_control_number?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subscriber_id?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  service_date_from?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  service_date_through?: string;

  @ApiProperty({ example: 10000 })
  @IsInt()
  @Min(0)
  billed_cents: number;

  @ApiProperty({ example: 8000 })
  @IsInt()
  paid_cents: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsInt()
  @IsOptional()
  patient_responsibility_cents?: number;

  @ApiPropertyOptional({ example: '1' })
  @IsString()
  @IsOptional()
  status_code?: string;

  @ApiPropertyOptional({ type: [EraAdjustmentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EraAdjustmentDto)
  @IsOptional()
  adjustments?: EraAdjustmentDto[];
}

export class IngestEraDto {
  @ApiProperty()
  @IsUUID()
  payer_config_id: string;

  @ApiProperty({ example: '2026-03-15' })
  @IsDateString()
  payment_date: string;

  @ApiProperty({ example: 'EFT-2026031500001' })
  @IsString()
  @IsNotEmpty()
  eft_trace_number: string;

  @ApiProperty({ example: 150000 })
  @IsInt()
  @Min(0)
  eft_total_cents: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  interchange_control_num?: string;

  @ApiProperty({ type: [EraClaimPaymentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EraClaimPaymentDto)
  claim_payments: EraClaimPaymentDto[];
}
