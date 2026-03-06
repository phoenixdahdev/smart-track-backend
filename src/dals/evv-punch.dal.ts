import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { EvvPunchEntity } from '@entities/evv-punch.entity';

@Injectable()
export class EvvPunchDal extends AbstractModelAction<EvvPunchEntity> {
  constructor(
    @InjectRepository(EvvPunchEntity)
    repository: Repository<EvvPunchEntity>,
  ) {
    super(repository, EvvPunchEntity);
  }
}
