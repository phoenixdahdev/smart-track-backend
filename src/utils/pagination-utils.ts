import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumberString } from 'class-validator';
import { type PaginationMeta } from '@app-types/pagination.types';

export type { PaginationMeta };

export const computePaginationMeta = (
  total: number,
  limit: number,
  page: number,
): PaginationMeta => {
  const total_pages = Math.ceil(total / limit);
  const has_next = page < total_pages;
  const has_previous = page > 1;

  return {
    total,
    limit,
    page,
    total_pages,
    has_next,
    has_previous,
  };
};

export class PaginationValidator {
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Page number',
    example: '1',
  })
  @IsNumberString({}, { message: 'Page must be a number string' })
  page?: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: '10',
  })
  @IsNumberString({}, { message: 'Limit must be a number string' })
  limit?: string;
}
