import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AgencyRole } from '@enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'jane@agency.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: AgencyRole, example: AgencyRole.DSP })
  @IsEnum(AgencyRole)
  role: AgencyRole;

  @ApiPropertyOptional({ example: '512-555-0100' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: 'supervisor-uuid',
    description: 'UUID of the supervising user',
  })
  @IsUUID()
  @IsOptional()
  supervisor_id?: string;

  @ApiPropertyOptional({
    example: { 'view:reports': true },
    description: 'Fine-grained sub-permission map',
  })
  @IsObject()
  @IsOptional()
  sub_permissions?: Record<string, boolean>;
}
