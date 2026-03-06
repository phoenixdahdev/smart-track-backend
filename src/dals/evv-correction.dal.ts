import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { EvvCorrectionEntity } from '@entities/evv-correction.entity';

@Injectable()
export class EvvCorrectionDal extends AbstractModelAction<EvvCorrectionEntity> {
  constructor(
    @InjectRepository(EvvCorrectionEntity)
    repository: Repository<EvvCorrectionEntity>,
  ) {
    super(repository, EvvCorrectionEntity);
  }
}
