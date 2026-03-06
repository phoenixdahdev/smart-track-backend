import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { OrgContactEntity } from '@entities/org-contact.entity';

@Injectable()
export class OrgContactDal extends AbstractModelAction<OrgContactEntity> {
  constructor(
    @InjectRepository(OrgContactEntity)
    repository: Repository<OrgContactEntity>,
  ) {
    super(repository, OrgContactEntity);
  }
}
