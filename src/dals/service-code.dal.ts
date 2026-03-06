import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { ServiceCodeEntity } from '@entities/service-code.entity';

@Injectable()
export class ServiceCodeDal extends AbstractModelAction<ServiceCodeEntity> {
  constructor(
    @InjectRepository(ServiceCodeEntity)
    repository: Repository<ServiceCodeEntity>,
  ) {
    super(repository, ServiceCodeEntity);
  }
}
