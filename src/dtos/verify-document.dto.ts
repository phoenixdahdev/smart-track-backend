import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyDocumentDto {
  @ApiProperty({ description: 'Whether the document is verified' })
  @IsBoolean()
  @IsNotEmpty()
  verified: boolean;

  @ApiPropertyOptional({ description: 'Verification notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
