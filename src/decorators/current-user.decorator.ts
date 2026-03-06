import { type Request } from 'express';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type AuthenticatedUser } from '@app-types/auth.types';

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
