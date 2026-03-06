import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { PlatformAuditLogEntity } from '@entities/platform-audit-log.entity';

@Injectable()
export class PlatformAuditLogDal extends AbstractModelAction<PlatformAuditLogEntity> {
  constructor(
    @InjectRepository(PlatformAuditLogEntity)
    repository: Repository<PlatformAuditLogEntity>,
  ) {
    super(repository, PlatformAuditLogEntity);
  }
}
