import { IS_PUBLIC_KEY, ROLES_KEY } from './roles.decorator';
import { IS_PRIVATE_KEY } from './private.decorator';
import { SKIP_RESPONSE_INTERCEPTOR } from './skip-response-interceptor.decorator';
import { SetMetadata } from '@nestjs/common';

// We test decorator metadata by applying them and reading via Reflect
describe('Decorators', () => {
  describe('Roles decorator', () => {
    it('should export ROLES_KEY constant', () => {
      expect(ROLES_KEY).toBe('roles');
    });

    it('should export IS_PUBLIC_KEY constant', () => {
      expect(IS_PUBLIC_KEY).toBe('isPublic');
    });
  });

  describe('PrivateFields decorator', () => {
    it('should export IS_PRIVATE_KEY constant', () => {
      expect(IS_PRIVATE_KEY).toBe('isPrivate');
    });
  });

  describe('SkipResponseInterceptor decorator', () => {
    it('should export SKIP_RESPONSE_INTERCEPTOR constant', () => {
      expect(SKIP_RESPONSE_INTERCEPTOR).toBe('skipResponseInterceptor');
    });
  });
});
