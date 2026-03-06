import { computePaginationMeta } from './pagination-utils';

describe('computePaginationMeta', () => {
  it('should compute correct meta for first page', () => {
    const meta = computePaginationMeta(50, 10, 1);
    expect(meta).toEqual({
      total: 50,
      limit: 10,
      page: 1,
      total_pages: 5,
      has_next: true,
      has_previous: false,
    });
  });

  it('should compute correct meta for last page', () => {
    const meta = computePaginationMeta(50, 10, 5);
    expect(meta).toEqual({
      total: 50,
      limit: 10,
      page: 5,
      total_pages: 5,
      has_next: false,
      has_previous: true,
    });
  });

  it('should compute correct meta for middle page', () => {
    const meta = computePaginationMeta(50, 10, 3);
    expect(meta).toEqual({
      total: 50,
      limit: 10,
      page: 3,
      total_pages: 5,
      has_next: true,
      has_previous: true,
    });
  });

  it('should handle single page', () => {
    const meta = computePaginationMeta(5, 10, 1);
    expect(meta).toEqual({
      total: 5,
      limit: 10,
      page: 1,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    });
  });

  it('should handle zero total', () => {
    const meta = computePaginationMeta(0, 10, 1);
    expect(meta).toEqual({
      total: 0,
      limit: 10,
      page: 1,
      total_pages: 0,
      has_next: false,
      has_previous: false,
    });
  });

  it('should handle exact page boundary', () => {
    const meta = computePaginationMeta(20, 10, 2);
    expect(meta.total_pages).toBe(2);
    expect(meta.has_next).toBe(false);
  });

  it('should handle partial last page', () => {
    const meta = computePaginationMeta(21, 10, 2);
    expect(meta.total_pages).toBe(3);
    expect(meta.has_next).toBe(true);
  });
});
