import { STRONG_PASSWORD_REGEX, PASSWORD_MESSAGE } from './password-policy';

describe('password-policy', () => {
  it('should accept a strong password', () => {
    expect(STRONG_PASSWORD_REGEX.test('StrongP@ss123!')).toBe(true);
  });

  it('should reject a password without uppercase', () => {
    expect(STRONG_PASSWORD_REGEX.test('weakpassword1!')).toBe(false);
  });

  it('should reject a password without special character', () => {
    expect(STRONG_PASSWORD_REGEX.test('WeakPassword123')).toBe(false);
  });

  it('should reject a password shorter than 12 characters', () => {
    expect(STRONG_PASSWORD_REGEX.test('Short1!aA')).toBe(false);
  });

  it('should export a user-friendly error message', () => {
    expect(PASSWORD_MESSAGE).toContain('12 characters');
  });
});
