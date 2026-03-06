import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { GlobalPayerEntity } from '@entities/global-payer.entity';

@Injectable()
export class GlobalPayerDal extends AbstractModelAction<GlobalPayerEntity> {
  constructor(
    @InjectRepository(GlobalPayerEntity)
    repository: Repository<GlobalPayerEntity>,
  ) {
    super(repository, GlobalPayerEntity);
  }
}
