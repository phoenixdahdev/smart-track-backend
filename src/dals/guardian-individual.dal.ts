import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { GuardianIndividualEntity } from '@entities/guardian-individual.entity';

@Injectable()
export class GuardianIndividualDal extends AbstractModelAction<GuardianIndividualEntity> {
  constructor(
    @InjectRepository(GuardianIndividualEntity)
    repository: Repository<GuardianIndividualEntity>,
  ) {
    super(repository, GuardianIndividualEntity);
  }
}
