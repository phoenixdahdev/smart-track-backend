import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { PayerConfigEntity } from '@entities/payer-config.entity';

@Injectable()
export class PayerConfigDal extends AbstractModelAction<PayerConfigEntity> {
  constructor(
    @InjectRepository(PayerConfigEntity)
    repository: Repository<PayerConfigEntity>,
  ) {
    super(repository, PayerConfigEntity);
  }
}
