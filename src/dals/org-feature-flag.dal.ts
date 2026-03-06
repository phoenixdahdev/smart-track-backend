import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { OrgFeatureFlagEntity } from '@entities/org-feature-flag.entity';

@Injectable()
export class OrgFeatureFlagDal extends AbstractModelAction<OrgFeatureFlagEntity> {
  constructor(
    @InjectRepository(OrgFeatureFlagEntity)
    repository: Repository<OrgFeatureFlagEntity>,
  ) {
    super(repository, OrgFeatureFlagEntity);
  }
}
