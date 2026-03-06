import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { BehaviorPlanEntity } from '@entities/behavior-plan.entity';

@Injectable()
export class BehaviorPlanDal extends AbstractModelAction<BehaviorPlanEntity> {
  constructor(
    @InjectRepository(BehaviorPlanEntity)
    repository: Repository<BehaviorPlanEntity>,
  ) {
    super(repository, BehaviorPlanEntity);
  }
}
