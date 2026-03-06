import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { PaymentPostEntity } from '@entities/payment-post.entity';

@Injectable()
export class PaymentPostDal extends AbstractModelAction<PaymentPostEntity> {
  constructor(
    @InjectRepository(PaymentPostEntity)
    repository: Repository<PaymentPostEntity>,
  ) {
    super(repository, PaymentPostEntity);
  }
}
