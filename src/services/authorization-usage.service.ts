import { Injectable } from '@nestjs/common';
import { ServiceAuthorizationDal } from '@dals/service-authorization.dal';
import { AuthorizationStatus } from '@enums/authorization-status.enum';
import {
  type AuthorizationUsageReport,
  type AuthorizationUsageRow,
} from '@app-types/reporting.types';
import { MAX_ANALYTICS_RECORDS } from '@utils/analytics-constants';

@Injectable()
export class AuthorizationUsageService {
  constructor(private readonly serviceAuthorizationDal: ServiceAuthorizationDal) {}

  async getAuthorizationUsage(
    orgId: string,
    filters?: {
      individual_id?: string;
      payer_config_id?: string;
      service_code_id?: string;
      alerts_only?: boolean;
    },
  ): Promise<AuthorizationUsageReport> {
    const findOptions: Record<string, unknown> = { org_id: orgId };
    if (filters?.individual_id) findOptions.individual_id = filters.individual_id;
    if (filters?.payer_config_id) findOptions.payer_config_id = filters.payer_config_id;
    if (filters?.service_code_id) findOptions.service_code_id = filters.service_code_id;

    const auths = await this.serviceAuthorizationDal.find({
      findOptions: findOptions as never,
      paginationPayload: { limit: MAX_ANALYTICS_RECORDS, page: 1 },
      transactionOptions: { useTransaction: false },
    });

    const now = new Date();
    const authorizations: AuthorizationUsageRow[] = [];
    let approachingThreshold = 0;
    let exceeded = 0;
    let expiringSoon = 0;

    for (const auth of auths.payload) {
      if (auth.status !== AuthorizationStatus.ACTIVE) continue;

      const unitsAuthorized = Number(auth.units_authorized);
      const unitsUsed = Number(auth.units_used);
      const unitsPending = Number(auth.units_pending);
      const unitsRemaining = unitsAuthorized - unitsUsed - unitsPending;
      const utilizationPercent = unitsAuthorized > 0
        ? Math.round(((unitsUsed + unitsPending) / unitsAuthorized) * 10000) / 100
        : 0;

      const endDate = new Date(auth.end_date);
      const daysUntilExpiry = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const isApproaching = utilizationPercent >= 80 && utilizationPercent < 100;
      const isExceeded = utilizationPercent >= 100;
      const isExpiring = daysUntilExpiry <= 30 && daysUntilExpiry > 0;

      if (isApproaching) approachingThreshold++;
      if (isExceeded) exceeded++;
      if (isExpiring) expiringSoon++;

      // If alerts_only, skip non-alert rows
      if (filters?.alerts_only && !isApproaching && !isExceeded && !isExpiring) {
        continue;
      }

      authorizations.push({
        authorization_id: auth.id,
        auth_number: auth.auth_number,
        individual_id: auth.individual_id,
        service_code_id: auth.service_code_id,
        payer_config_id: auth.payer_config_id,
        units_authorized: unitsAuthorized,
        units_used: unitsUsed,
        units_pending: unitsPending,
        units_remaining: Math.max(0, unitsRemaining),
        utilization_percent: utilizationPercent,
        start_date: auth.start_date,
        end_date: auth.end_date,
        days_until_expiry: daysUntilExpiry,
        status: auth.status,
      });
    }

    return {
      authorizations,
      approaching_threshold: approachingThreshold,
      exceeded,
      expiring_soon: expiringSoon,
    };
  }
}
