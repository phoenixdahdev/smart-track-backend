import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'a1b2c3d4e5f6...', description: 'Reset token from email' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'newSecureP@ss1', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
