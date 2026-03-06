import { QueryDeepPartialEntity } from 'typeorm';
import { FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { TransactionOptions } from './transaction-options';

export type UpdateRecordGeneric<T extends ObjectLiteral> = {
  updatePayload: QueryDeepPartialEntity<T>;
  identifierOptions: FindOptionsWhere<T>;
  transactionOptions: TransactionOptions;
};
