import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { AdlCategoryEntity } from '@entities/adl-category.entity';

@Injectable()
export class AdlCategoryDal extends AbstractModelAction<AdlCategoryEntity> {
  constructor(
    @InjectRepository(AdlCategoryEntity)
    repository: Repository<AdlCategoryEntity>,
  ) {
    super(repository, AdlCategoryEntity);
  }
}
