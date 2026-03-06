import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { ClaimLineEntity } from '@entities/claim-line.entity';

@Injectable()
export class ClaimLineDal extends AbstractModelAction<ClaimLineEntity> {
  constructor(
    @InjectRepository(ClaimLineEntity)
    repository: Repository<ClaimLineEntity>,
  ) {
    super(repository, ClaimLineEntity);
  }
}
