import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { OnboardingTaskEntity } from '@entities/onboarding-task.entity';

@Injectable()
export class OnboardingTaskDal extends AbstractModelAction<OnboardingTaskEntity> {
  constructor(
    @InjectRepository(OnboardingTaskEntity)
    repository: Repository<OnboardingTaskEntity>,
  ) {
    super(repository, OnboardingTaskEntity);
  }
}
