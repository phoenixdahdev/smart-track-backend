import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { SubscriptionEntity } from '@entities/subscription.entity';

@Injectable()
export class SubscriptionDal extends AbstractModelAction<SubscriptionEntity> {
  constructor(
    @InjectRepository(SubscriptionEntity)
    repository: Repository<SubscriptionEntity>,
  ) {
    super(repository, SubscriptionEntity);
  }
}
