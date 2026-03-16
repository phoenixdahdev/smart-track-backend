import { Injectable, NotFoundException } from '@nestjs/common';
import { PlanDefinitionDal } from '@dals/plan-definition.dal';
import { SubscriptionDal } from '@dals/subscription.dal';
import { InvoiceDal } from '@dals/invoice.dal';
import { AuditLogService } from './audit-log.service';
import { type CreatePlanDefinitionDto } from '@dtos/create-plan-definition.dto';
import { type UpdatePlanDefinitionDto } from '@dtos/update-plan-definition.dto';
import { type UpdateSubscriptionDto } from '@dtos/update-subscription.dto';
import { type PaginationValidator } from '@utils/pagination-utils';
import { InvoiceStatus } from '@enums/invoice-status.enum';

@Injectable()
export class SubscriptionManagementService {
  constructor(
    private readonly planDal: PlanDefinitionDal,
    private readonly subscriptionDal: SubscriptionDal,
    private readonly invoiceDal: InvoiceDal,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createPlan(
    dto: CreatePlanDefinitionDto,
    operatorId: string,
    ip: string,
    ua: string,
  ) {
    const plan = await this.planDal.create({
      createPayload: { ...dto, active: true } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: 'PLAN_CREATED',
      target_type: 'plan_definitions',
      target_id: plan.id,
      after_val: plan as unknown as Record<string, unknown>,
      ip_address: ip,
      user_agent: ua,
    });

    return plan;
  }

  async updatePlan(
    id: string,
    dto: UpdatePlanDefinitionDto,
    operatorId: string,
    ip: string,
    ua: string,
  ) {
    const before = await this.planDal.get({
      identifierOptions: { id } as never,
    });

    if (!before) {
      throw new NotFoundException();
    }

    const updated = await this.planDal.update({
      identifierOptions: { id } as never,
      updatePayload: dto as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: 'PLAN_UPDATED',
      target_type: 'plan_definitions',
      target_id: id,
      before_val: before as unknown as Record<string, unknown>,
      after_val: updated as unknown as Record<string, unknown>,
      ip_address: ip,
      user_agent: ua,
    });

    return updated;
  }

  async getPlan(id: string) {
    const plan = await this.planDal.get({
      identifierOptions: { id } as never,
    });

    if (!plan) {
      throw new NotFoundException();
    }

    return plan;
  }

  async listPlans() {
    return this.planDal.find({
      findOptions: {} as never,
      order: { price_cents_monthly: 'ASC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async getSubscription(orgId: string) {
    const subscription = await this.subscriptionDal.get({
      identifierOptions: { org_id: orgId } as never,
    });

    if (!subscription) {
      throw new NotFoundException();
    }

    return subscription;
  }

  async updateSubscription(
    orgId: string,
    dto: UpdateSubscriptionDto,
    operatorId: string,
    ip: string,
    ua: string,
  ) {
    const before = await this.getSubscription(orgId);

    const updated = await this.subscriptionDal.update({
      identifierOptions: { id: before.id } as never,
      updatePayload: dto as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: 'SUBSCRIPTION_UPDATED',
      target_type: 'subscriptions',
      target_id: before.id,
      before_val: before as unknown as Record<string, unknown>,
      after_val: updated as unknown as Record<string, unknown>,
      ip_address: ip,
      user_agent: ua,
    });

    return updated;
  }

  async listInvoices(orgId: string, pagination?: PaginationValidator) {
    const page = parseInt(pagination?.page ?? '1', 10);
    const limit = parseInt(pagination?.limit ?? '20', 10);

    return this.invoiceDal.find({
      findOptions: { org_id: orgId } as never,
      paginationPayload: { page, limit },
      order: { due_date: 'DESC' } as never,
      transactionOptions: { useTransaction: false },
    });
  }

  async createInvoice(
    orgId: string,
    amountCents: number,
    dueDate: string,
    operatorId: string,
    ip: string,
    ua: string,
  ) {
    const subscription = await this.getSubscription(orgId);

    const invoice = await this.invoiceDal.create({
      createPayload: {
        org_id: orgId,
        subscription_id: subscription.id,
        amount_cents: amountCents,
        status: InvoiceStatus.DRAFT,
        due_date: dueDate,
      } as never,
      transactionOptions: { useTransaction: false },
    });

    await this.auditLogService.logPlatformAction({
      operator_id: operatorId,
      operator_role: 'PLATFORM_ADMIN',
      action: 'INVOICE_CREATED',
      target_type: 'invoices',
      target_id: invoice.id,
      after_val: invoice as unknown as Record<string, unknown>,
      ip_address: ip,
      user_agent: ua,
    });

    return invoice;
  }
}
