import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationValidator } from '@utils/pagination-utils';
import { PlatformRole } from '@enums/role.enum';

export class OperatorQueryDto extends PaginationValidator {
  @ApiPropertyOptional({ description: 'Filter by role', enum: PlatformRole })
  @IsEnum(PlatformRole)
  @IsOptional()
  role?: PlatformRole;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  active?: boolean;
}
