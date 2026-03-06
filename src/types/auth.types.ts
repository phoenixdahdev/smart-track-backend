import { type UserRole } from '@enums/role.enum';

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  org_id: string | null;
  sub_permissions: Record<string, boolean>;
  session_timeout: number;
  mfa_enabled: boolean;
  email_verified: boolean;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  org_id: string | null;
};
