import { DeepPartial, ObjectLiteral } from 'typeorm';
import { TransactionOptions } from './transaction-options';

export type CreateRecordGeneric<T extends ObjectLiteral> = {
  createPayload: DeepPartial<T>;
  transactionOptions: TransactionOptions;
};
