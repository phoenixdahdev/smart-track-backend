import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitApplicationDto {
  @ApiProperty({ description: 'Organization name' })
  @IsString()
  @IsNotEmpty()
  org_name: string;

  @ApiProperty({ description: 'NPI number' })
  @IsString()
  @IsNotEmpty()
  npi: string;

  @ApiProperty({ description: 'EIN number' })
  @IsString()
  @IsNotEmpty()
  ein: string;

  @ApiProperty({ description: 'Contact name' })
  @IsString()
  @IsNotEmpty()
  contact_name: string;

  @ApiProperty({ description: 'Contact email' })
  @IsEmail()
  @IsNotEmpty()
  contact_email: string;

  @ApiPropertyOptional({ description: 'Contact phone' })
  @IsString()
  @IsOptional()
  contact_phone?: string;

  @ApiPropertyOptional({ description: 'Plan tier' })
  @IsString()
  @IsOptional()
  plan_tier?: string;
}
