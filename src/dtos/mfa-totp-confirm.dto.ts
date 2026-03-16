import { IsString, Length } from 'class-validator';

export class MfaTotpConfirmDto {
  @IsString()
  @Length(6, 6)
  code: string;
}
