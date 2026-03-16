import { RiskScoringService } from './risk-scoring.service';

describe('RiskScoringService', () => {
  let service: RiskScoringService;

  beforeEach(() => {
    service = new RiskScoringService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateRiskScore', () => {
    it('should return LOW risk for valid application', () => {
      const result = service.calculateRiskScore({
        npi: '1234567890',
        ein: '123456789',
        contact_email: 'admin@myagency.org',
        plan_tier: 'STARTER',
      });

      expect(result.score).toBe('LOW');
      expect(result.factors).toHaveLength(0);
    });

    it('should flag invalid NPI format', () => {
      const result = service.calculateRiskScore({
        npi: '123',
        ein: '123456789',
        contact_email: 'admin@myagency.org',
        plan_tier: null,
      });

      expect(result.factors).toContain('Invalid NPI format');
    });

    it('should flag invalid EIN format', () => {
      const result = service.calculateRiskScore({
        npi: '1234567890',
        ein: '12345',
        contact_email: 'admin@myagency.org',
        plan_tier: null,
      });

      expect(result.factors).toContain('Invalid EIN format');
    });

    it('should flag free email domains', () => {
      const result = service.calculateRiskScore({
        npi: '1234567890',
        ein: '123456789',
        contact_email: 'admin@gmail.com',
        plan_tier: null,
      });

      expect(result.factors).toContain('Free email domain used');
    });

    it('should flag enterprise tier without valid NPI', () => {
      const result = service.calculateRiskScore({
        npi: '123',
        ein: '123456789',
        contact_email: 'admin@myagency.org',
        plan_tier: 'ENTERPRISE',
      });

      expect(result.factors).toContain('Enterprise tier without valid NPI');
    });

    it('should return MEDIUM risk for 1–2 factors', () => {
      const result = service.calculateRiskScore({
        npi: '1234567890',
        ein: '123456789',
        contact_email: 'admin@gmail.com',
        plan_tier: null,
      });

      expect(result.score).toBe('MEDIUM');
    });

    it('should return HIGH risk for 3+ factors', () => {
      const result = service.calculateRiskScore({
        npi: '123',
        ein: '12345',
        contact_email: 'admin@gmail.com',
        plan_tier: 'ENTERPRISE',
      });

      expect(result.score).toBe('HIGH');
      expect(result.factors.length).toBeGreaterThanOrEqual(3);
    });
  });
});
