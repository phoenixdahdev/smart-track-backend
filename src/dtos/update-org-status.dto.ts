import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OrgStatus } from '@enums/org-status.enum';

export class UpdateOrgStatusDto {
  @ApiProperty({ description: 'Target status', enum: OrgStatus })
  @IsEnum(OrgStatus)
  @IsNotEmpty()
  status: OrgStatus;

  @ApiProperty({ description: 'Reason for status change' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
