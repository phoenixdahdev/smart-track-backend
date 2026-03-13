import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateClaimDto {
  @ApiPropertyOptional({ description: 'Diagnosis codes' })
  @IsArray()
  @IsOptional()
  diagnosis_codes?: string[];

  @ApiPropertyOptional({ description: 'Place of service' })
  @IsString()
  @IsOptional()
  place_of_service?: string;

  @ApiPropertyOptional({ description: 'Subscriber ID' })
  @IsString()
  @IsOptional()
  subscriber_id?: string;
}
