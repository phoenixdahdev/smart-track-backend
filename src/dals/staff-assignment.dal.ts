import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { StaffAssignmentEntity } from '@entities/staff-assignment.entity';

@Injectable()
export class StaffAssignmentDal extends AbstractModelAction<StaffAssignmentEntity> {
  constructor(
    @InjectRepository(StaffAssignmentEntity)
    repository: Repository<StaffAssignmentEntity>,
  ) {
    super(repository, StaffAssignmentEntity);
  }
}
