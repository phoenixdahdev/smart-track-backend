import { EntityManager } from 'typeorm';

export type TransactionOptions =
  | { useTransaction: false }
  | { useTransaction: true; transaction: EntityManager };
