import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { BillingCycle } from '@enums/billing-cycle.enum';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsUUID()
  @IsNotEmpty()
  org_id: string;

  @ApiProperty({ description: 'Plan tier' })
  @IsString()
  @IsNotEmpty()
  plan_tier: string;

  @ApiProperty({ description: 'Billing cycle', enum: BillingCycle })
  @IsEnum(BillingCycle)
  @IsNotEmpty()
  billing_cycle: BillingCycle;

  @ApiPropertyOptional({ description: 'Trial end date' })
  @IsDateString()
  @IsOptional()
  trial_ends_at?: string;
}
