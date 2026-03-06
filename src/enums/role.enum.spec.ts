import { PlatformRole, AgencyRole } from './role.enum';

describe('Role Enums', () => {
  describe('PlatformRole', () => {
    it('should define all platform roles', () => {
      expect(PlatformRole.PLATFORM_OWNER).toBe('PLATFORM_OWNER');
      expect(PlatformRole.PLATFORM_ADMIN).toBe('PLATFORM_ADMIN');
      expect(PlatformRole.ONBOARDING_SPECIALIST).toBe('ONBOARDING_SPECIALIST');
      expect(PlatformRole.SUPPORT_ENGINEER).toBe('SUPPORT_ENGINEER');
      expect(PlatformRole.BILLING_OPERATOR).toBe('BILLING_OPERATOR');
      expect(PlatformRole.COMPLIANCE_AUDITOR).toBe('COMPLIANCE_AUDITOR');
    });

    it('should have exactly 6 platform roles', () => {
      expect(Object.keys(PlatformRole)).toHaveLength(6);
    });
  });

  describe('AgencyRole', () => {
    it('should define all agency roles', () => {
      expect(AgencyRole.ADMIN).toBe('ADMIN');
      expect(AgencyRole.SUPERVISOR).toBe('SUPERVISOR');
      expect(AgencyRole.DSP).toBe('DSP');
      expect(AgencyRole.CLINICIAN).toBe('CLINICIAN');
      expect(AgencyRole.BILLING_SPECIALIST).toBe('BILLING_SPECIALIST');
      expect(AgencyRole.FINANCE_MANAGER).toBe('FINANCE_MANAGER');
      expect(AgencyRole.GUARDIAN).toBe('GUARDIAN');
      expect(AgencyRole.AGENCY_OWNER).toBe('AGENCY_OWNER');
      expect(AgencyRole.SCHEDULER).toBe('SCHEDULER');
      expect(AgencyRole.HR_MANAGER).toBe('HR_MANAGER');
    });

    it('should have exactly 10 agency roles', () => {
      expect(Object.keys(AgencyRole)).toHaveLength(10);
    });
  });

  describe('role isolation', () => {
    it('platform and agency roles should not overlap', () => {
      const platformValues = Object.values(PlatformRole);
      const agencyValues = Object.values(AgencyRole);
      const overlap = platformValues.filter((v) => agencyValues.includes(v as any));
      expect(overlap).toHaveLength(0);
    });
  });
});
