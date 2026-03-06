import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { CorrectionRequestEntity } from '@entities/correction-request.entity';

@Injectable()
export class CorrectionRequestDal extends AbstractModelAction<CorrectionRequestEntity> {
  constructor(
    @InjectRepository(CorrectionRequestEntity)
    repository: Repository<CorrectionRequestEntity>,
  ) {
    super(repository, CorrectionRequestEntity);
  }
}
