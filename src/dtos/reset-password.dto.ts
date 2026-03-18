import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';
import {
  STRONG_PASSWORD_REGEX,
  PASSWORD_MESSAGE,
} from '@utils/password-policy';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6...',
    description: 'Reset token from email',
  })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewStrongP@ss123!', minLength: 12 })
  @IsString()
  @MinLength(12)
  @Matches(STRONG_PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword: string;
}
