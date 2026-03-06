import {
  ObjectLiteral,
  FindOptionsWhere,
  FindOptionsOrder,
  FindOptionsRelations,
} from 'typeorm';

export type ListRecordGeneric<T extends ObjectLiteral> = {
  filterRecordOptions?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
  relations?: FindOptionsRelations<T>;
  paginationPayload?: {
    limit: number;
    page: number;
  };
  order?: FindOptionsOrder<T>;
};
