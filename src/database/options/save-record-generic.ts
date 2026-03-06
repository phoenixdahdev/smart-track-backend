import { ObjectLiteral } from 'typeorm';
import { TransactionOptions } from './transaction-options';

export type SaveRecordGeneric<T extends ObjectLiteral> = {
  entity: T;
  transactionOptions: TransactionOptions;
};
