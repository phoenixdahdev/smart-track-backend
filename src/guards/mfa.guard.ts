import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@decorators/roles.decorator';
import { MFA_PENDING_KEY } from '@decorators/mfa-pending.decorator';
import { type AuthenticatedUser } from '@app-types/auth.types';

@Injectable()
export class MfaGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const isMfaPending = this.reflector.getAllAndOverride<boolean>(
      MFA_PENDING_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isMfaPending) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) return false;

    if (user.mfa_enabled && !user.mfa_verified) {
      throw new UnauthorizedException('MFA verification required');
    }

    return true;
  }
}
