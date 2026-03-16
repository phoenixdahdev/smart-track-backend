import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { SubscriptionStatus } from '@enums/subscription-status.enum';
import { BillingCycle } from '@enums/billing-cycle.enum';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ description: 'Plan tier' })
  @IsString()
  @IsOptional()
  plan_tier?: string;

  @ApiPropertyOptional({ description: 'Subscription status', enum: SubscriptionStatus })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ description: 'Billing cycle', enum: BillingCycle })
  @IsEnum(BillingCycle)
  @IsOptional()
  billing_cycle?: BillingCycle;

  @ApiPropertyOptional({ description: 'Monthly recurring revenue in cents' })
  @IsInt()
  @Min(0)
  @IsOptional()
  mrr_cents?: number;
}
