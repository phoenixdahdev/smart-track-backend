import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { ProgramEntity } from '@entities/program.entity';

@Injectable()
export class ProgramDal extends AbstractModelAction<ProgramEntity> {
  constructor(
    @InjectRepository(ProgramEntity)
    repository: Repository<ProgramEntity>,
  ) {
    super(repository, ProgramEntity);
  }
}
