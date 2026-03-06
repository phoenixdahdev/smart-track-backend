import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { InvoiceEntity } from '@entities/invoice.entity';

@Injectable()
export class InvoiceDal extends AbstractModelAction<InvoiceEntity> {
  constructor(
    @InjectRepository(InvoiceEntity)
    repository: Repository<InvoiceEntity>,
  ) {
    super(repository, InvoiceEntity);
  }
}
