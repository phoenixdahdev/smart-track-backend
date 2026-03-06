import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { GlobalServiceCodeEntity } from '@entities/global-service-code.entity';

@Injectable()
export class GlobalServiceCodeDal extends AbstractModelAction<GlobalServiceCodeEntity> {
  constructor(
    @InjectRepository(GlobalServiceCodeEntity)
    repository: Repository<GlobalServiceCodeEntity>,
  ) {
    super(repository, GlobalServiceCodeEntity);
  }
}
