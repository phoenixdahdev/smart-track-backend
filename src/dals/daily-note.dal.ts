import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { DailyNoteEntity } from '@entities/daily-note.entity';

@Injectable()
export class DailyNoteDal extends AbstractModelAction<DailyNoteEntity> {
  constructor(
    @InjectRepository(DailyNoteEntity)
    repository: Repository<DailyNoteEntity>,
  ) {
    super(repository, DailyNoteEntity);
  }
}
