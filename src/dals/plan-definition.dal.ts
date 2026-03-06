import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { PlanDefinitionEntity } from '@entities/plan-definition.entity';

@Injectable()
export class PlanDefinitionDal extends AbstractModelAction<PlanDefinitionEntity> {
  constructor(
    @InjectRepository(PlanDefinitionEntity)
    repository: Repository<PlanDefinitionEntity>,
  ) {
    super(repository, PlanDefinitionEntity);
  }
}
