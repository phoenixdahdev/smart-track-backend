import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { OnboardingChecklistEntity } from '@entities/onboarding-checklist.entity';

@Injectable()
export class OnboardingChecklistDal extends AbstractModelAction<OnboardingChecklistEntity> {
  constructor(
    @InjectRepository(OnboardingChecklistEntity)
    repository: Repository<OnboardingChecklistEntity>,
  ) {
    super(repository, OnboardingChecklistEntity);
  }
}
