import { SubPermissionsService } from './sub-permissions.service';
import { type AuthenticatedUser } from '@app-types/auth.types';
import { AgencyRole } from '@enums/role.enum';

describe('SubPermissionsService', () => {
  let service: SubPermissionsService;

  const makeUser = (perms: Record<string, boolean>): AuthenticatedUser => ({
    id: 'user-1',
    email: 'test@test.com',
    role: AgencyRole.DSP,
    org_id: 'org-1',
    name: 'Test User',
    sub_permissions: perms,
    session_timeout: 30,
    mfa_enabled: false,
    mfa_type: 'NONE',
    mfa_verified: true,
    email_verified: true,
  });

  beforeEach(() => {
    service = new SubPermissionsService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hasPermission', () => {
    it('should return true when permission exists and is true', () => {
      const user = makeUser({ 'view:reports': true });
      expect(service.hasPermission(user, 'view:reports')).toBe(true);
    });

    it('should return false when permission exists and is false', () => {
      const user = makeUser({ 'view:reports': false });
      expect(service.hasPermission(user, 'view:reports')).toBe(false);
    });

    it('should return false when permission does not exist', () => {
      const user = makeUser({});
      expect(service.hasPermission(user, 'view:reports')).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all required permissions', () => {
      const user = makeUser({ 'view:reports': true, 'edit:records': true });
      expect(
        service.hasAllPermissions(user, ['view:reports', 'edit:records']),
      ).toBe(true);
    });

    it('should return false when user is missing one permission', () => {
      const user = makeUser({ 'view:reports': true, 'edit:records': false });
      expect(
        service.hasAllPermissions(user, ['view:reports', 'edit:records']),
      ).toBe(false);
    });

    it('should return true for empty permissions array', () => {
      const user = makeUser({});
      expect(service.hasAllPermissions(user, [])).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one permission', () => {
      const user = makeUser({ 'view:reports': true, 'edit:records': false });
      expect(
        service.hasAnyPermission(user, ['view:reports', 'edit:records']),
      ).toBe(true);
    });

    it('should return false when user has none of the permissions', () => {
      const user = makeUser({ 'view:reports': false });
      expect(
        service.hasAnyPermission(user, ['view:reports', 'edit:records']),
      ).toBe(false);
    });

    it('should return false for empty permissions array', () => {
      const user = makeUser({});
      expect(service.hasAnyPermission(user, [])).toBe(false);
    });
  });
});
