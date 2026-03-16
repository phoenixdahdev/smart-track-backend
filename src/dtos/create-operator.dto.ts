import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PlatformRole } from '@enums/role.enum';

export class CreateOperatorDto {
  @ApiProperty({ description: 'Operator email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Operator name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Platform role', enum: PlatformRole })
  @IsEnum(PlatformRole)
  @IsNotEmpty()
  role: PlatformRole;
}
