import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class SigninDto {
  @ApiProperty({ example: 'jane@agency.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secureP@ss1' })
  @IsString()
  password: string;
}
