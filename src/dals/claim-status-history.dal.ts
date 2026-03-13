import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { ClaimStatusHistoryEntity } from '@entities/claim-status-history.entity';

@Injectable()
export class ClaimStatusHistoryDal extends AbstractModelAction<ClaimStatusHistoryEntity> {
  constructor(
    @InjectRepository(ClaimStatusHistoryEntity)
    repository: Repository<ClaimStatusHistoryEntity>,
  ) {
    super(repository, ClaimStatusHistoryEntity);
  }
}
