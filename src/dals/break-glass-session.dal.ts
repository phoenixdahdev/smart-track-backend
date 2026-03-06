import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { BreakGlassSessionEntity } from '@entities/break-glass-session.entity';

@Injectable()
export class BreakGlassSessionDal extends AbstractModelAction<BreakGlassSessionEntity> {
  constructor(
    @InjectRepository(BreakGlassSessionEntity)
    repository: Repository<BreakGlassSessionEntity>,
  ) {
    super(repository, BreakGlassSessionEntity);
  }
}
