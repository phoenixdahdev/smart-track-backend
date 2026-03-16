import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { AdlEntryEntity } from '@entities/adl-entry.entity';

@Injectable()
export class AdlEntryDal extends AbstractModelAction<AdlEntryEntity> {
  constructor(
    @InjectRepository(AdlEntryEntity)
    repository: Repository<AdlEntryEntity>,
  ) {
    super(repository, AdlEntryEntity);
  }
}
