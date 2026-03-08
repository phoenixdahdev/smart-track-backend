import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class UpdateIndividualDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiPropertyOptional({ example: '123-45-6789' })
  @IsString()
  @IsOptional()
  ssn?: string;

  @ApiPropertyOptional({
    example: '1990-05-15',
    description: 'YYYY-MM-DD',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date_of_birth must be YYYY-MM-DD' })
  @IsOptional()
  date_of_birth?: string;

  @ApiPropertyOptional({ example: 'MA12345678' })
  @IsString()
  @IsOptional()
  medicaid_id?: string;

  @ApiPropertyOptional({ example: 'F84.0,F70' })
  @IsString()
  @IsOptional()
  diagnosis_codes?: string;

  @ApiPropertyOptional({ example: '456 Elm St, Austin TX 78701' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '512-555-0123' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Jane Doe — 512-555-0199' })
  @IsString()
  @IsOptional()
  emergency_contact?: string;

  @ApiPropertyOptional({ example: 'guardian-uuid' })
  @IsUUID()
  @IsOptional()
  guardian_id?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
