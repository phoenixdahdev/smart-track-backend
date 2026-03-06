import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { IndividualEntity } from '@entities/individual.entity';

@Injectable()
export class IndividualDal extends AbstractModelAction<IndividualEntity> {
  constructor(
    @InjectRepository(IndividualEntity)
    repository: Repository<IndividualEntity>,
  ) {
    super(repository, IndividualEntity);
  }
}
