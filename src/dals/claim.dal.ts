import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { ClaimEntity } from '@entities/claim.entity';

@Injectable()
export class ClaimDal extends AbstractModelAction<ClaimEntity> {
  constructor(
    @InjectRepository(ClaimEntity)
    repository: Repository<ClaimEntity>,
  ) {
    super(repository, ClaimEntity);
  }
}
