import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { IspDataPointEntity } from '@entities/isp-data-point.entity';

@Injectable()
export class IspDataPointDal extends AbstractModelAction<IspDataPointEntity> {
  constructor(
    @InjectRepository(IspDataPointEntity)
    repository: Repository<IspDataPointEntity>,
  ) {
    super(repository, IspDataPointEntity);
  }
}
