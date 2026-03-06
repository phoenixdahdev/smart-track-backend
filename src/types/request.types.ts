import { type UserRole } from '@enums/role.enum';

export type RequestWithUser = {
  user?: {
    id: string;
    role: UserRole;
    org_id: string | null;
  };
};
