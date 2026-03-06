import { type PaginationMeta } from '@app-types/pagination.types';

export function buildResponse<T>(
  data: T,
  message: string,
  meta?: PaginationMeta,
  success?: boolean,
): { data: T; message: string; meta?: PaginationMeta; success: boolean } {
  return {
    data,
    message,
    meta,
    success: success !== undefined ? success : true,
  };
}
