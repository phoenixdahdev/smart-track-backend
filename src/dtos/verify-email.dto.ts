import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'jane@agency.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '482910', description: '6-digit OTP code' })
  @IsString()
  @Length(6, 6)
  otp: string;
}
