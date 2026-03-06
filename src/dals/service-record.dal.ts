import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { ServiceRecordEntity } from '@entities/service-record.entity';

@Injectable()
export class ServiceRecordDal extends AbstractModelAction<ServiceRecordEntity> {
  constructor(
    @InjectRepository(ServiceRecordEntity)
    repository: Repository<ServiceRecordEntity>,
  ) {
    super(repository, ServiceRecordEntity);
  }
}
