import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AgencyRole } from '@enums/role.enum';
import { UserStatus } from '@enums/user-status.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jane Smith' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '512-555-0100' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: AgencyRole, example: AgencyRole.SUPERVISOR })
  @IsEnum(AgencyRole)
  @IsOptional()
  role?: AgencyRole;

  @ApiPropertyOptional({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional({ example: 'supervisor-uuid' })
  @IsUUID()
  @IsOptional()
  supervisor_id?: string;

  @ApiPropertyOptional({ example: { 'view:reports': true } })
  @IsObject()
  @IsOptional()
  sub_permissions?: Record<string, boolean>;

  @ApiPropertyOptional({ example: '["CPR", "First Aid"]' })
  @IsOptional()
  certifications?: unknown[];

  @ApiPropertyOptional({ example: 'BCBA License #12345' })
  @IsString()
  @IsOptional()
  license_info?: string;
}
