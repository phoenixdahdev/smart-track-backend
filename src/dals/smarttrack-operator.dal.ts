import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { SmarttrackOperatorEntity } from '@entities/smarttrack-operator.entity';

@Injectable()
export class SmarttrackOperatorDal extends AbstractModelAction<SmarttrackOperatorEntity> {
  constructor(
    @InjectRepository(SmarttrackOperatorEntity)
    repository: Repository<SmarttrackOperatorEntity>,
  ) {
    super(repository, SmarttrackOperatorEntity);
  }
}
