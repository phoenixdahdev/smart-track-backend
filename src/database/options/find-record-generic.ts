import { FindOptionsOrder, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { TransactionOptions } from './transaction-options';

export type FindRecordGeneric<T extends ObjectLiteral> = {
  findOptions?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
  transactionOptions: TransactionOptions;
  paginationPayload?: {
    limit: number;
    page: number;
  };
  order?: FindOptionsOrder<T>;
};
