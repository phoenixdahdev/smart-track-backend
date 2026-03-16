import { Injectable } from '@nestjs/common';
import { type RiskScore } from '@app-types/superadmin.types';

@Injectable()
export class RiskScoringService {
  calculateRiskScore(application: {
    npi: string;
    ein: string;
    contact_email: string;
    plan_tier: string | null;
  }): RiskScore {
    const factors: string[] = [];

    // NPI format check (must be 10 digits)
    if (!/^\d{10}$/.test(application.npi)) {
      factors.push('Invalid NPI format');
    }

    // EIN format check (must be 9 digits)
    if (!/^\d{9}$/.test(application.ein)) {
      factors.push('Invalid EIN format');
    }

    // Free email domain check
    const freeEmailDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'aol.com',
    ];
    const emailDomain = application.contact_email.split('@')[1]?.toLowerCase();
    if (emailDomain && freeEmailDomains.includes(emailDomain)) {
      factors.push('Free email domain used');
    }

    // Enterprise tier without NPI verification
    if (
      application.plan_tier === 'ENTERPRISE' &&
      !/^\d{10}$/.test(application.npi)
    ) {
      factors.push('Enterprise tier without valid NPI');
    }

    let score: RiskScore['score'];
    if (factors.length >= 3) {
      score = 'HIGH';
    } else if (factors.length >= 1) {
      score = 'MEDIUM';
    } else {
      score = 'LOW';
    }

    return { score, factors };
  }
}
