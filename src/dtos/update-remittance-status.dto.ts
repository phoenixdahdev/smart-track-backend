import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RemittanceStatus } from '@enums/remittance-status.enum';

export class UpdateRemittanceStatusDto {
  @ApiProperty({ enum: RemittanceStatus })
  @IsEnum(RemittanceStatus)
  status: RemittanceStatus;
}
