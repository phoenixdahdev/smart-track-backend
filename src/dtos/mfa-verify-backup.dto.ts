import { IsString, IsNotEmpty } from 'class-validator';

export class MfaVerifyBackupDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
