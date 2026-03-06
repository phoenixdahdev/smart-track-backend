import { Injectable } from '@nestjs/common';
import { type AuthenticatedUser } from '@app-types/auth.types';

@Injectable()
export class SubPermissionsService {
  hasPermission(user: AuthenticatedUser, permission: string): boolean {
    return user.sub_permissions[permission] === true;
  }

  hasAllPermissions(user: AuthenticatedUser, permissions: string[]): boolean {
    return permissions.every((p) => this.hasPermission(user, p));
  }

  hasAnyPermission(user: AuthenticatedUser, permissions: string[]): boolean {
    return permissions.some((p) => this.hasPermission(user, p));
  }
}
