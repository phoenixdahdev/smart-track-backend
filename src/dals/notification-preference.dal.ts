import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { NotificationPreferenceEntity } from '@entities/notification-preference.entity';

@Injectable()
export class NotificationPreferenceDal extends AbstractModelAction<NotificationPreferenceEntity> {
  constructor(
    @InjectRepository(NotificationPreferenceEntity)
    repository: Repository<NotificationPreferenceEntity>,
  ) {
    super(repository, NotificationPreferenceEntity);
  }
}
