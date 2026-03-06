import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Sunrise Care Services LLC' })
  @IsString()
  @IsNotEmpty()
  legal_name: string;

  @ApiPropertyOptional({ example: 'Sunrise Care' })
  @IsString()
  @IsOptional()
  dba?: string;

  @ApiProperty({ example: '1234567890', description: '10-digit NPI number' })
  @IsString()
  @Length(10, 10)
  @Matches(/^\d{10}$/, { message: 'NPI must be a 10-digit number' })
  npi: string;

  @ApiProperty({
    example: '12-3456789',
    description: 'Employer Identification Number',
  })
  @IsString()
  @IsNotEmpty()
  ein: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsString()
  @IsOptional()
  address_line1?: string;

  @ApiPropertyOptional({ example: 'Suite 200' })
  @IsString()
  @IsOptional()
  address_line2?: string;

  @ApiPropertyOptional({ example: 'Austin' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'TX', description: '2-letter state code' })
  @IsString()
  @Length(2, 2)
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '78701' })
  @IsString()
  @IsOptional()
  zip?: string;

  @ApiPropertyOptional({ example: '512-555-0100' })
  @IsString()
  @IsOptional()
  phone?: string;
}
