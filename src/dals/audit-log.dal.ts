import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { AuditLogEntity } from '@entities/audit-log.entity';

@Injectable()
export class AuditLogDal extends AbstractModelAction<AuditLogEntity> {
  constructor(
    @InjectRepository(AuditLogEntity)
    repository: Repository<AuditLogEntity>,
  ) {
    super(repository, AuditLogEntity);
  }
}
