import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreatePlanDefinitionDto {
  @ApiProperty({ description: 'Plan tier name' })
  @IsString()
  @IsNotEmpty()
  tier_name: string;

  @ApiProperty({ description: 'Max individuals allowed' })
  @IsInt()
  @Min(1)
  max_individuals: number;

  @ApiProperty({ description: 'Max users allowed' })
  @IsInt()
  @Min(1)
  max_users: number;

  @ApiProperty({ description: 'Storage in GB' })
  @IsInt()
  @Min(1)
  storage_gb: number;

  @ApiProperty({ description: 'Monthly API calls limit' })
  @IsInt()
  @Min(0)
  api_calls_monthly: number;

  @ApiProperty({ description: 'Modules included', type: [String] })
  @IsArray()
  @IsString({ each: true })
  modules_included: string[];

  @ApiProperty({ description: 'Monthly price in cents' })
  @IsInt()
  @Min(0)
  price_cents_monthly: number;
}
