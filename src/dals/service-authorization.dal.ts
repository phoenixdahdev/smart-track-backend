import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { ServiceAuthorizationEntity } from '@entities/service-authorization.entity';

@Injectable()
export class ServiceAuthorizationDal extends AbstractModelAction<ServiceAuthorizationEntity> {
  constructor(
    @InjectRepository(ServiceAuthorizationEntity)
    repository: Repository<ServiceAuthorizationEntity>,
  ) {
    super(repository, ServiceAuthorizationEntity);
  }
}
