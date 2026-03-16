import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class ToggleModuleDto {
  @ApiProperty({ description: 'Module name' })
  @IsString()
  @IsNotEmpty()
  module_name: string;

  @ApiProperty({ description: 'Enable or disable' })
  @IsBoolean()
  @IsNotEmpty()
  enabled: boolean;
}
