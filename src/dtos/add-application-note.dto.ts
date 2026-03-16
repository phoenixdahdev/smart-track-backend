import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddApplicationNoteDto {
  @ApiProperty({ description: 'Note text' })
  @IsString()
  @IsNotEmpty()
  note_text: string;
}
