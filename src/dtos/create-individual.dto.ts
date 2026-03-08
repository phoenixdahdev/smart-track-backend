import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateIndividualDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiPropertyOptional({
    example: '123-45-6789',
    description: 'Social Security Number (stored encrypted)',
  })
  @IsString()
  @IsOptional()
  ssn?: string;

  @ApiProperty({
    example: '1990-05-15',
    description: 'Date of birth in YYYY-MM-DD format (stored encrypted)',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date_of_birth must be YYYY-MM-DD' })
  date_of_birth: string;

  @ApiPropertyOptional({
    example: 'MA12345678',
    description: 'Medicaid ID (stored encrypted)',
  })
  @IsString()
  @IsOptional()
  medicaid_id?: string;

  @ApiPropertyOptional({
    example: 'F84.0,F70',
    description: 'ICD-10 diagnosis codes (stored encrypted)',
  })
  @IsString()
  @IsOptional()
  diagnosis_codes?: string;

  @ApiPropertyOptional({
    example: '456 Elm St, Austin TX 78701',
    description: 'Home address (stored encrypted)',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: '512-555-0123',
    description: 'Contact phone (stored encrypted)',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: 'Jane Doe — 512-555-0199',
    description: 'Emergency contact details (stored encrypted)',
  })
  @IsString()
  @IsOptional()
  emergency_contact?: string;

  @ApiPropertyOptional({
    example: 'guardian-uuid',
    description: 'UUID of the guardian user account (if any)',
  })
  @IsUUID()
  @IsOptional()
  guardian_id?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
