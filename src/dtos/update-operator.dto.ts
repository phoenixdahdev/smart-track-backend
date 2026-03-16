import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PlatformRole } from '@enums/role.enum';

export class UpdateOperatorDto {
  @ApiPropertyOptional({ description: 'Operator name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Platform role', enum: PlatformRole })
  @IsEnum(PlatformRole)
  @IsOptional()
  role?: PlatformRole;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
