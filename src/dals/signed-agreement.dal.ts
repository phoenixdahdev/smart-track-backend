import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { SignedAgreementEntity } from '@entities/signed-agreement.entity';

@Injectable()
export class SignedAgreementDal extends AbstractModelAction<SignedAgreementEntity> {
  constructor(
    @InjectRepository(SignedAgreementEntity)
    repository: Repository<SignedAgreementEntity>,
  ) {
    super(repository, SignedAgreementEntity);
  }
}
