import camelToSnake from './camel-to-snake-case';

describe('camelToSnake', () => {
  it('should convert simple camelCase keys to snake_case', () => {
    const result = camelToSnake({ firstName: 'John', lastName: 'Doe' });
    expect(result).toEqual({ first_name: 'John', last_name: 'Doe' });
  });

  it('should handle nested objects', () => {
    const result = camelToSnake({
      userData: {
        firstName: 'John',
        contactInfo: { phoneNumber: '555-1234' },
      },
    });
    expect(result).toEqual({
      user_data: {
        first_name: 'John',
        contact_info: { phone_number: '555-1234' },
      },
    });
  });

  it('should handle arrays', () => {
    const result = camelToSnake([
      { firstName: 'John' },
      { firstName: 'Jane' },
    ]);
    expect(result).toEqual([
      { first_name: 'John' },
      { first_name: 'Jane' },
    ]);
  });

  it('should handle arrays inside objects', () => {
    const result = camelToSnake({
      userList: [{ firstName: 'John' }],
    });
    expect(result).toEqual({
      user_list: [{ first_name: 'John' }],
    });
  });

  it('should return primitives unchanged', () => {
    expect(camelToSnake('hello')).toBe('hello');
    expect(camelToSnake(42)).toBe(42);
    expect(camelToSnake(true)).toBe(true);
    expect(camelToSnake(null)).toBe(null);
    expect(camelToSnake(undefined)).toBe(undefined);
  });

  it('should not convert Date objects', () => {
    const date = new Date('2026-01-01');
    const result = camelToSnake({ createdAt: date });
    expect(result).toEqual({ created_at: date });
  });

  it('should strip private fields when provided', () => {
    const privateFields = new Set(['password', 'ssn']);
    const result = camelToSnake(
      { name: 'John', password: 'secret', ssn: '123-45-6789', email: 'john@test.com' },
      privateFields,
    );
    expect(result).toEqual({ name: 'John', email: 'john@test.com' });
    expect((result as any).password).toBeUndefined();
    expect((result as any).ssn).toBeUndefined();
  });

  it('should strip private fields in nested objects', () => {
    const privateFields = new Set(['password']);
    const result = camelToSnake(
      { user: { name: 'John', password: 'secret' } },
      privateFields,
    );
    expect(result).toEqual({ user: { name: 'John' } });
  });

  it('should handle keys already in snake_case', () => {
    const result = camelToSnake({ org_id: '123', first_name: 'John' });
    expect(result).toEqual({ org_id: '123', first_name: 'John' });
  });

  it('should handle empty objects', () => {
    expect(camelToSnake({})).toEqual({});
  });

  it('should handle empty arrays', () => {
    expect(camelToSnake([])).toEqual([]);
  });
});
