import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { AdjustmentEntity } from '@entities/adjustment.entity';

@Injectable()
export class AdjustmentDal extends AbstractModelAction<AdjustmentEntity> {
  constructor(
    @InjectRepository(AdjustmentEntity)
    repository: Repository<AdjustmentEntity>,
  ) {
    super(repository, AdjustmentEntity);
  }
}
