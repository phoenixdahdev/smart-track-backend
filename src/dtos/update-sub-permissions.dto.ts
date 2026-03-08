import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateSubPermissionsDto {
  @ApiProperty({ example: { 'view:reports': true } })
  @IsObject()
  sub_permissions: Record<string, boolean>;
}
