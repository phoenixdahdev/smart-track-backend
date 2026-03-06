import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { IspGoalEntity } from '@entities/isp-goal.entity';

@Injectable()
export class IspGoalDal extends AbstractModelAction<IspGoalEntity> {
  constructor(
    @InjectRepository(IspGoalEntity)
    repository: Repository<IspGoalEntity>,
  ) {
    super(repository, IspGoalEntity);
  }
}
