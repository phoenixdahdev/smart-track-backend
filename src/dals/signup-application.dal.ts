import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { SignupApplicationEntity } from '@entities/signup-application.entity';

@Injectable()
export class SignupApplicationDal extends AbstractModelAction<SignupApplicationEntity> {
  constructor(
    @InjectRepository(SignupApplicationEntity)
    repository: Repository<SignupApplicationEntity>,
  ) {
    super(repository, SignupApplicationEntity);
  }
}
