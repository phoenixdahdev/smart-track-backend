# SmartTrack Health - Agent Configuration

## Agent Identity

You are building SmartTrack Health, a HIPAA-compliant IDD care documentation and billing platform. You are working on the NestJS backend API.

## Decision Framework

### Before Writing Code

1. Read the relevant spec in `docs/` for the feature you're implementing
2. Check `plan.md` for phase context and dependencies
3. Check `progress.md` for what's already done
4. Read existing related code before modifying anything
5. Verify the feature's place in the Golden Thread: DSP → Service Record → Supervisor Approval → Billing → Claim → ERA → Payment

### When Making Architecture Decisions

- Default to the simplest solution that satisfies security requirements
- If a decision isn't covered in the specs, flag it as an open question rather than assuming
- Follow the flat architecture pattern (no NestJS feature modules)
- Follow the existing code patterns in the codebase

### Security-First Checklist (Run Mentally Before Every Feature)

- [ ] Does this touch PHI? → Add field-level encryption
- [ ] Does this query tenant data? → Verify RLS is applied
- [ ] Does this endpoint need role checks? → Add @Roles() + guard
- [ ] Does this return data? → Ensure no PHI in error paths
- [ ] Does this mutate data? → Add audit log entry
- [ ] Does this involve money? → Use integer cents
- [ ] Does this change record status? → Validate state machine transition
- [ ] Does this cross console boundaries? → Stop. Redesign.

## Implementation Patterns

### Adding a New Feature (Step by Step)

1. **Entity** — Create in `src/entities/feature.entity.ts`, extend `TenantBaseEntity` (adds `org_id`, `id`, `created_at`, `updated_at`)
2. **DAL** — Create in `src/dals/feature.dal.ts`, extend `AbstractModelAction<FeatureEntity>`
3. **DTOs** — Create in `src/dtos/create-feature.dto.ts`, `update-feature.dto.ts`
4. **Service** — Create in `src/services/feature.service.ts`
5. **Controller** — Create in `src/controllers/feature.controller.ts`
6. **Register** — Add to `base.service.ts` (providers), `base.controller.ts` (controllers), `imports.ts` (TypeOrmModule.forFeature)
7. **Tests** — Write `.spec.ts` files alongside each file

### Entity Pattern (TypeORM)

```typescript
import { Entity, Column } from 'typeorm';
import { TenantBaseEntity } from '@entities/tenant-base.entity';

@Entity('feature_name')
export class FeatureEntity extends TenantBaseEntity {
  // org_id, id, created_at, updated_at inherited

  @Column({ type: 'varchar', length: 255 })
  name: string;
}
```

### DAL Pattern

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '@database/abstract-model-action';
import { FeatureEntity } from '@entities/feature.entity';

@Injectable()
export class FeatureDal extends AbstractModelAction<FeatureEntity> {
  constructor(
    @InjectRepository(FeatureEntity) repository: Repository<FeatureEntity>,
  ) {
    super(repository, FeatureEntity);
  }
}
```

### Controller Pattern

```typescript
import { Controller, Get } from '@nestjs/common';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { AgencyRole } from '@enums/role.enum';

@Controller('api/v1/billing/claims')
export class ClaimsController {
  @Get()
  @Roles(AgencyRole.BILLING_SPECIALIST, AgencyRole.FINANCE_MANAGER)
  async findAll(@CurrentUser() user) {
    // org_id comes from user context, enforced by RLS
  }
}
```

### Service Registration Pattern

```typescript
// In services/base.service.ts — add to the providers array
export const services: Provider[] = [
  // ... existing
  FeatureService,
  FeatureDal,
];

// In controllers/base.controller.ts — add to controllers array
export const controllers: ModuleMetadata['controllers'] = [
  // ... existing
  FeatureController,
];

// In imports.ts — add entity to TypeOrmModule.forFeature
TypeOrmModule.forFeature([..., FeatureEntity]),
```

### State Machine Pattern

```typescript
import { validateTransition } from '@utils/state-machine';
import {
  SERVICE_RECORD_TRANSITIONS,
  ServiceRecordStatus,
} from '@enums/service-record-status.enum';

// Use in service:
if (!validateTransition(SERVICE_RECORD_TRANSITIONS, currentStatus, newStatus)) {
  throw new BadRequestException('Invalid status transition');
}
```

### Financial Calculation Pattern

```typescript
// All money in cents (integers)
const unitRate = 1500; // $15.00
const units = 4;
const totalCents = unitRate * units; // 6000 = $60.00
// Never: const total = 15.00 * 4;
```

## Console-Specific Guidelines

### SuperAdmin (`/superadmin/*`)

- Platform operators only — hardware MFA required
- Manages tenants, not tenant data
- Agency onboarding pipeline (7-stage state machine)
- Break-glass access protocol for emergency tenant access
- Separate from all agency-level logic

### Admin (`/admin/*`)

- Agency configuration, user management, program/site setup
- Can view but not create service documentation
- Manages payer config and rate tables

### Supervisor (`/supervisor/*`)

- Review queue is the core feature — approve/reject service records
- Cannot create documentation, only review
- Monitors staff compliance and ISP progress

### Staff/DSP (`/staff/*`)

- Creates service records, daily notes, incident reports
- EVV clock-in/clock-out
- Cannot approve own documentation
- MAR module access controlled by sub-permissions

### Clinician (`/clinical/*`)

- Behavior Treatment Plans (BTP)
- Clinical data review and analysis
- Cannot submit claims

### Billing (`/billing/*`)

- Claims only from APPROVED service records (enforced at DB)
- 7-phase claims processing pipeline
- Authorization management (three-bucket model)
- 835 ERA payment reconciliation
- All amounts in cents

### Guardian Portal (`/portal/*`)

- Read-only — no write endpoints
- Filtered view of individual's data
- No clinical details, no billing data

## Quality Gates

### Before Marking a Feature Complete

1. Unit tests pass with >80% coverage for the module
2. E2e test with realistic data scenarios
3. RLS tested: create data as Org A, verify Org B cannot see it
4. Role tested: verify unauthorized roles get 404
5. Audit log: verify all mutations create audit entries
6. PHI check: verify no PHI in logs or error responses
7. State machine: verify invalid transitions are rejected

### Before Committing

- `pnpm lint` passes
- `pnpm test` passes
- No TODO/FIXME without a linked issue
- No hardcoded secrets or credentials
- No `console.log` — use NestJS Logger

## File Reference

| File                                                  | Purpose                                       |
| ----------------------------------------------------- | --------------------------------------------- |
| `plan.md`                                             | Development phases, architecture, data model  |
| `CLAUDE.md`                                           | Project conventions, commands, critical rules |
| `progress.md`                                         | Phase/feature completion tracking             |
| `docs/SmartTrack_Developer_Specification (2).pdf`     | Canonical tech spec                           |
| `docs/SmartTrack_Billing_Console_Dev_Walkthrough.pdf` | Billing implementation guide                  |
| `docs/SmartTrack_SuperAdmin_Console_Spec.pdf`         | SuperAdmin console spec                       |
| `docs/SmartTrack Developer Specification Vol 01.pdf`  | Role system + wireframes                      |
| `docs/SmartTrack Health Enterprise EVV...pdf`         | EVV + scheduling + UI spec                    |
| `docs/ref.txt`                                        | Scope clarification (no payment processing)   |
