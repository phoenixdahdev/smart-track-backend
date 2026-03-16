import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePlanDefinitionDto {
  @ApiPropertyOptional({ description: 'Plan tier name' })
  @IsString()
  @IsOptional()
  tier_name?: string;

  @ApiPropertyOptional({ description: 'Max individuals allowed' })
  @IsInt()
  @Min(1)
  @IsOptional()
  max_individuals?: number;

  @ApiPropertyOptional({ description: 'Max users allowed' })
  @IsInt()
  @Min(1)
  @IsOptional()
  max_users?: number;

  @ApiPropertyOptional({ description: 'Storage in GB' })
  @IsInt()
  @Min(1)
  @IsOptional()
  storage_gb?: number;

  @ApiPropertyOptional({ description: 'Monthly API calls limit' })
  @IsInt()
  @Min(0)
  @IsOptional()
  api_calls_monthly?: number;

  @ApiPropertyOptional({ description: 'Modules included', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  modules_included?: string[];

  @ApiPropertyOptional({ description: 'Monthly price in cents' })
  @IsInt()
  @Min(0)
  @IsOptional()
  price_cents_monthly?: number;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
