import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { ClaimSubmissionEntity } from '@entities/claim-submission.entity';

@Injectable()
export class ClaimSubmissionDal extends AbstractModelAction<ClaimSubmissionEntity> {
  constructor(
    @InjectRepository(ClaimSubmissionEntity)
    repository: Repository<ClaimSubmissionEntity>,
  ) {
    super(repository, ClaimSubmissionEntity);
  }
}
