import {
  DeleteResult,
  EntityTarget,
  FindOneOptions,
  FindOptionsOrder,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { GetRecordOptions } from './options/get-record-options';
import { ListRecordGeneric } from './options/list-record-generic';
import { FindRecordGeneric } from './options/find-record-generic';
import { CreateRecordGeneric } from './options/create-record-generic';
import { DeleteRecordGeneric } from './options/delete-record-generic';
import { UpdateRecordGeneric } from './options/update-record-generic';
import { SaveRecordGeneric } from './options/save-record-generic';
import { computePaginationMeta, PaginationMeta } from '@utils/pagination-utils';

export abstract class AbstractModelAction<T extends ObjectLiteral> {
  model: EntityTarget<T>;

  constructor(
    protected readonly repository: Repository<T>,
    model: EntityTarget<T>,
  ) {
    this.model = model;
  }

  async create(createRecordOptions: CreateRecordGeneric<T>): Promise<T> {
    const { createPayload, transactionOptions } = createRecordOptions;
    const modelRepository = transactionOptions.useTransaction
      ? transactionOptions.transaction.getRepository(this.model)
      : this.repository;

    const response = await modelRepository.save(createPayload);
    return response as T;
  }

  async save(saveRecordOptions: SaveRecordGeneric<T>): Promise<T> {
    const { entity, transactionOptions } = saveRecordOptions;
    const modelRepository = transactionOptions.useTransaction
      ? transactionOptions.transaction.getRepository(this.model)
      : this.repository;

    return await modelRepository.save(entity);
  }

  async update(updateRecordOptions: UpdateRecordGeneric<T>): Promise<T | null> {
    const { updatePayload, identifierOptions, transactionOptions } =
      updateRecordOptions;
    const modelRepository = transactionOptions.useTransaction
      ? transactionOptions.transaction.getRepository(this.model)
      : this.repository;

    await modelRepository.update(identifierOptions, updatePayload);
    return await modelRepository.findOne({ where: identifierOptions });
  }

  async delete(
    deleteRecordOptions: DeleteRecordGeneric<T>,
  ): Promise<DeleteResult> {
    const { identifierOptions, transactionOptions } = deleteRecordOptions;
    const modelRepository = transactionOptions.useTransaction
      ? transactionOptions.transaction.getRepository(this.model)
      : this.repository;

    return await modelRepository.delete(identifierOptions);
  }

  async get(getRecordOptions: GetRecordOptions<T>): Promise<T | null> {
    const { identifierOptions, queryOptions, relations } = getRecordOptions;
    const findOptions: FindOneOptions<T> = {
      where: identifierOptions,
      relations,
      ...queryOptions,
    };
    return await this.repository.findOne(findOptions);
  }

  async find(findRecordOptions: FindRecordGeneric<T>): Promise<{
    payload: T[];
    paginationMeta: Partial<PaginationMeta>;
  }> {
    const { findOptions, transactionOptions, paginationPayload, order } =
      findRecordOptions;

    const modelRepository = transactionOptions.useTransaction
      ? transactionOptions.transaction.getRepository(this.model)
      : this.repository;

    const orderBy: FindOptionsOrder<T> = order || ({} as FindOptionsOrder<T>);

    if (paginationPayload) {
      const { limit, page } = paginationPayload;
      const query = await modelRepository.find({
        where: findOptions,
        take: +limit,
        skip: +limit * (+page - 1),
        order: orderBy,
      });
      const total = await modelRepository.count({ where: findOptions });

      return {
        payload: query,
        paginationMeta: computePaginationMeta(total, +limit, +page),
      };
    }

    const query = await modelRepository.find({
      where: findOptions,
      order: orderBy,
    });

    return {
      payload: query,
      paginationMeta: { total: query.length },
    };
  }

  async list(listRecordOptions: ListRecordGeneric<T>): Promise<{
    payload: T[];
    paginationMeta: Partial<PaginationMeta>;
  }> {
    const { paginationPayload, filterRecordOptions, relations, order } =
      listRecordOptions;

    const orderBy: FindOptionsOrder<T> = order || ({} as FindOptionsOrder<T>);

    if (paginationPayload) {
      const { limit, page } = paginationPayload;
      const query = await this.repository.find({
        where: filterRecordOptions,
        relations,
        take: +limit,
        skip: +limit * (+page - 1),
        order: orderBy,
      });
      const total = await this.repository.count({
        where: filterRecordOptions,
      });

      return {
        payload: query,
        paginationMeta: computePaginationMeta(total, +limit, +page),
      };
    }

    const query = await this.repository.find({
      where: filterRecordOptions,
      relations,
      order: orderBy,
    });

    return {
      payload: query,
      paginationMeta: { total: query.length },
    };
  }
}
