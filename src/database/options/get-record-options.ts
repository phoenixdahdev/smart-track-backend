import {
  ObjectLiteral,
  FindOptionsWhere,
  FindOptionsRelations,
  FindOneOptions,
} from 'typeorm';

export type GetRecordOptions<T extends ObjectLiteral> = {
  identifierOptions: FindOptionsWhere<T>;
  queryOptions?: {
    select?: (keyof T)[];
    cache?: boolean | number;
    lock?: FindOneOptions['lock'];
  };
  relations?: FindOptionsRelations<T>;
};
