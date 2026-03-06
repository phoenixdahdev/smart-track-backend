import { buildResponse } from './response-formatter';

describe('buildResponse', () => {
  it('should build a success response with data and message', () => {
    const result = buildResponse({ id: '123' }, 'Created');
    expect(result).toEqual({
      data: { id: '123' },
      message: 'Created',
      meta: undefined,
      success: true,
    });
  });

  it('should include pagination meta when provided', () => {
    const meta = {
      total: 50,
      limit: 10,
      page: 1,
      total_pages: 5,
      has_next: true,
      has_previous: false,
    };
    const result = buildResponse([], 'Listed', meta);
    expect(result.meta).toEqual(meta);
  });

  it('should default success to true', () => {
    const result = buildResponse(null, 'Test');
    expect(result.success).toBe(true);
  });

  it('should allow explicit success override', () => {
    const result = buildResponse(null, 'Failed', undefined, false);
    expect(result.success).toBe(false);
  });

  it('should handle null data', () => {
    const result = buildResponse(null, 'Not found');
    expect(result.data).toBeNull();
  });

  it('should handle array data', () => {
    const result = buildResponse([1, 2, 3], 'List');
    expect(result.data).toEqual([1, 2, 3]);
  });
});
