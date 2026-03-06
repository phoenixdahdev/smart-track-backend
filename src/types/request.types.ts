import { type AuthenticatedUser } from './auth.types';

export type RequestWithUser = {
  user?: AuthenticatedUser;
};
