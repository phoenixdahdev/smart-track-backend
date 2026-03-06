import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleSigninDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIs...',
    description: 'Google OAuth2 ID token',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
