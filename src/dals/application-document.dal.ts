import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { ApplicationDocumentEntity } from '@entities/application-document.entity';

@Injectable()
export class ApplicationDocumentDal extends AbstractModelAction<ApplicationDocumentEntity> {
  constructor(
    @InjectRepository(ApplicationDocumentEntity)
    repository: Repository<ApplicationDocumentEntity>,
  ) {
    super(repository, ApplicationDocumentEntity);
  }
}
