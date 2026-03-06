import { FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { TransactionOptions } from './transaction-options';

export type DeleteRecordGeneric<T extends ObjectLiteral> = {
  identifierOptions: FindOptionsWhere<T>;
  transactionOptions: TransactionOptions;
};
