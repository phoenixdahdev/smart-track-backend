import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { ShiftEntity } from '@entities/shift.entity';

@Injectable()
export class ShiftDal extends AbstractModelAction<ShiftEntity> {
  constructor(
    @InjectRepository(ShiftEntity)
    repository: Repository<ShiftEntity>,
  ) {
    super(repository, ShiftEntity);
  }
}
