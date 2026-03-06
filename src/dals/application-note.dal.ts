import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { ApplicationNoteEntity } from '@entities/application-note.entity';

@Injectable()
export class ApplicationNoteDal extends AbstractModelAction<ApplicationNoteEntity> {
  constructor(
    @InjectRepository(ApplicationNoteEntity)
    repository: Repository<ApplicationNoteEntity>,
  ) {
    super(repository, ApplicationNoteEntity);
  }
}
