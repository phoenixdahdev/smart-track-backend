import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { IncidentEntity } from '@entities/incident.entity';

@Injectable()
export class IncidentDal extends AbstractModelAction<IncidentEntity> {
  constructor(
    @InjectRepository(IncidentEntity)
    repository: Repository<IncidentEntity>,
  ) {
    super(repository, IncidentEntity);
  }
}
