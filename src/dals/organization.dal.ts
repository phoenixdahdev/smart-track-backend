import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { OrganizationEntity } from '@entities/organization.entity';

@Injectable()
export class OrganizationDal extends AbstractModelAction<OrganizationEntity> {
  constructor(
    @InjectRepository(OrganizationEntity)
    repository: Repository<OrganizationEntity>,
  ) {
    super(repository, OrganizationEntity);
  }
}
