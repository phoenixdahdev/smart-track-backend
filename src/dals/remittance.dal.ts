import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { RemittanceEntity } from '@entities/remittance.entity';

@Injectable()
export class RemittanceDal extends AbstractModelAction<RemittanceEntity> {
  constructor(
    @InjectRepository(RemittanceEntity)
    repository: Repository<RemittanceEntity>,
  ) {
    super(repository, RemittanceEntity);
  }
}
