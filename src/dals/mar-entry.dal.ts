import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { MarEntryEntity } from '@entities/mar-entry.entity';

@Injectable()
export class MarEntryDal extends AbstractModelAction<MarEntryEntity> {
  constructor(
    @InjectRepository(MarEntryEntity)
    repository: Repository<MarEntryEntity>,
  ) {
    super(repository, MarEntryEntity);
  }
}
