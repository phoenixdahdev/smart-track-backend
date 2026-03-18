import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import {
  STRONG_PASSWORD_REGEX,
  PASSWORD_MESSAGE,
} from '@utils/password-policy';

export class SignupDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'jane@agency.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongP@ss123!', minLength: 12 })
  @IsString()
  @MinLength(12)
  @Matches(STRONG_PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;
}
