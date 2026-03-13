import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { IndividualPayerCoverageEntity } from '@entities/individual-payer-coverage.entity';

@Injectable()
export class IndividualPayerCoverageDal extends AbstractModelAction<IndividualPayerCoverageEntity> {
  constructor(
    @InjectRepository(IndividualPayerCoverageEntity)
    repository: Repository<IndividualPayerCoverageEntity>,
  ) {
    super(repository, IndividualPayerCoverageEntity);
  }
}
