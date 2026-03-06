import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { SiteEntity } from '@entities/site.entity';

@Injectable()
export class SiteDal extends AbstractModelAction<SiteEntity> {
  constructor(
    @InjectRepository(SiteEntity)
    repository: Repository<SiteEntity>,
  ) {
    super(repository, SiteEntity);
  }
}
