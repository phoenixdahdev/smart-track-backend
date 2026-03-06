import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { OrgModuleEntity } from '@entities/org-module.entity';

@Injectable()
export class OrgModuleDal extends AbstractModelAction<OrgModuleEntity> {
  constructor(
    @InjectRepository(OrgModuleEntity)
    repository: Repository<OrgModuleEntity>,
  ) {
    super(repository, OrgModuleEntity);
  }
}
