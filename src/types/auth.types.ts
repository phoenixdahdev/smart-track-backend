import { type UserRole } from '@enums/role.enum';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
  org_id: string | null;
  sub_permissions: Record<string, boolean>;
  [key: string]: unknown;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  org_id: string | null;
};
