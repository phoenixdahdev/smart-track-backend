import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AgencyRole } from '@enums/role.enum';

export class AssignRoleDto {
  @ApiProperty({ enum: AgencyRole, example: AgencyRole.SUPERVISOR })
  @IsEnum(AgencyRole)
  role: AgencyRole;
}
