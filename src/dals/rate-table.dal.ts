import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { RateTableEntity } from '@entities/rate-table.entity';

@Injectable()
export class RateTableDal extends AbstractModelAction<RateTableEntity> {
  constructor(
    @InjectRepository(RateTableEntity)
    repository: Repository<RateTableEntity>,
  ) {
    super(repository, RateTableEntity);
  }
}
