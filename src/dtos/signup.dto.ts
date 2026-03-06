import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'jane@agency.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secureP@ss1', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
