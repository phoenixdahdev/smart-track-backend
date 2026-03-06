# SmartTrack Health - Progress Tracker

> Last updated: 2026-03-06

## Legend
- [ ] Not started
- [~] In progress
- [x] Complete
- [!] Blocked (see notes)

---

## Phase 0: Project Foundation
**Status: In Progress**

| Task | Status | Notes |
|------|--------|-------|
| Initialize NestJS project | [x] | NestJS 11, pnpm, TypeScript |
| ESLint + Prettier config | [x] | Flat config, single quotes, trailing commas |
| TypeScript config | [x] | Path aliases, strictNullChecks, decorators |
| PostgreSQL connection (TypeORM) | [x] | DatabaseModule, data-source.ts, AbstractModelAction + DAL pattern |
| Environment config module | [x] | @nestjs/config (global) + .env.example |
| Database migrations infrastructure | [x] | TypeORM CLI scripts (generate, run, revert) |
| Flat architecture setup | [x] | controllers/, services/, dals/, entities/, decorators/, guards/, interceptors/, exceptions/ |
| Response interceptor | [x] | Standard envelope, camelToSnake, PHI field stripping |
| Exception filter | [x] | AllExceptionsFilter — PHI-safe error responses |
| Guards (JWT + Roles) | [x] | JwtAuthGuard, RolesGuard with @Public/@Roles decorators |
| Decorators | [x] | @CurrentUser, @Roles, @Public, @PrivateFields, @SkipResponseInterceptor |
| Enums + state machines | [x] | PlatformRole, AgencyRole, ServiceRecordStatus, ClaimStatus + transitions |
| Base entities | [x] | BaseEntity (UUID+timestamps), TenantBaseEntity (adds org_id) |
| Utils | [x] | camelToSnake, pagination, responseFormatter, validateTransition |
| Security middleware (CORS, helmet, compression) | [x] | main.ts bootstrap |
| Swagger/OpenAPI | [x] | /api/docs |
| ValidationPipe | [x] | Global with whitelist + transform |
| Test infrastructure + specs | [x] | 84 tests, 11 suites — guards, interceptors, filters, decorators, utils, enums |
| CI/CD pipeline | [ ] | |
| Project documentation | [x] | CLAUDE.md, plan.md, agent.md, progress.md |

**Decisions Made:**
- ORM: TypeORM (flat DAL pattern, not NestJS modules)
- Auth: Auth0
- Architecture: Flat (single AppModule, registries in base.service.ts + base.controller.ts)

---

## Phase 1: Authentication & Multi-Tenancy
**Status: Not Started**

| Task | Status | Notes |
|------|--------|-------|
| Auth module (JWT + refresh) | [ ] | |
| Auth0 integration | [ ] | |
| MFA support (TOTP + FIDO2) | [ ] | |
| Organizations table | [ ] | |
| RLS policies | [ ] | |
| Tenant context middleware | [ ] | Sets org_id from JWT for RLS |
| RBAC guard decorators | [ ] | @Roles(), @Permissions() |
| Sub-permissions model | [ ] | JSON field on user record |
| Session management | [ ] | Per-role timeout config |
| Audit log module | [ ] | Append-only, no UPDATE/DELETE |
| Encryption service (AES-256) | [ ] | Field-level PHI encryption |

---

## Phase 2: Core Entity Layer
**Status: Not Started**

| Task | Status | Notes |
|------|--------|-------|
| Users module | [ ] | |
| Organizations module | [ ] | |
| Programs module | [ ] | |
| Sites module | [ ] | |
| Individuals module | [ ] | PHI — encrypted fields |
| Staff assignments module | [ ] | |
| Console-scoped API routing | [ ] | /api/v1/{console}/... |
| Permission matrix enforcement | [ ] | |
| Seed data / dev fixtures | [ ] | |

---

## Phase 3: Service Documentation
**Status: Not Started**

| Task | Status | Notes |
|------|--------|-------|
| Service records module | [ ] | State machine: DRAFT → PENDING_REVIEW → APPROVED/REJECTED |
| Daily notes module | [ ] | |
| ISP goals module | [ ] | |
| ISP data points module | [ ] | |
| Incident reporting module | [ ] | |
| BTP module (Clinician) | [ ] | |
| MAR module | [ ] | |
| Supervisor review queue | [ ] | Core approval workflow |
| Immutability enforcement | [ ] | Approved records locked |
| Correction request workflow | [ ] | Append-only amendments |

---

## Phase 4: EVV (Electronic Visit Verification)
**Status: Not Started**

| Task | Status | Notes |
|------|--------|-------|
| Clock-in / clock-out endpoints | [ ] | |
| GPS capture + validation | [ ] | |
| Shift association | [ ] | |
| Missed punch detection | [ ] | |
| Double clock-in prevention | [ ] | |
| Shift overlap detection | [ ] | |
| EVV → service record linkage | [ ] | |

---

## Phase 5: Scheduling
**Status: Not Started**

| Task | Status | Notes |
|------|--------|-------|
| Schedule creation | [ ] | Admin/supervisor |
| Shift assignment | [ ] | |
| Staff schedule view | [ ] | |
| Accept/reject workflow | [ ] | |
| Conflict detection | [ ] | |
| Schedule-to-EVV linkage | [ ] | |

---

## Phase 6: Billing & Claims Engine
**Status: Not Started**

| Task | Status | Notes |
|------|--------|-------|
| Billing queue (approved unbilled records) | [ ] | |
| Service authorization management | [ ] | Three-bucket model |
| Authorization threshold alerts | [ ] | |
| Payer configuration module | [ ] | |
| Rate tables module | [ ] | |
| Service codes module | [ ] | Linked to global library |
| Claim generation (service record → claim) | [ ] | |
| Claim type determination (837P vs 837I) | [ ] | |
| 7-step mapping logic | [ ] | |
| Pre-submission validation (13 checks) | [ ] | |
| EDI 837 generation | [ ] | x12-parser / node-x12 |
| Clearinghouse integration | [ ] | Provider TBD |
| Claim submission tracking | [ ] | |
| 277 status response processing | [ ] | |
| Claim status lifecycle | [ ] | |
| Denial handling workflow | [ ] | |

---

## Phase 7: Payment Reconciliation
**Status: Not Started**

| Task | Status | Notes |
|------|--------|-------|
| 835 ERA file ingestion | [ ] | |
| ERA parsing | [ ] | |
| 4-priority matching algorithm | [ ] | |
| Payment posting module | [ ] | |
| Adjustment processing | [ ] | |
| EFT reconciliation | [ ] | |
| AR aging reports | [ ] | |
| Financial dashboard endpoints | [ ] | |

---

## Phase 8: SuperAdmin Console API
**Status: Not Started**

| Task | Status | Notes |
|------|--------|-------|
| Operator management | [ ] | |
| Agency signup pipeline (7-stage) | [ ] | |
| Application review queue | [ ] | |
| Risk scoring | [ ] | NPI, EIN, BAA validation |
| Tenant provisioning automation | [ ] | 12-step process |
| Onboarding checklists | [ ] | |
| Agency management | [ ] | Directory, detail, status actions |
| Global service code library | [ ] | |
| Global payer configuration | [ ] | |
| Subscription plan management | [ ] | |
| Feature flags + module toggles | [ ] | |
| Platform health monitoring | [ ] | |
| Break-glass access protocol | [ ] | |
| Platform audit log | [ ] | |

---

## Phase 9: Notification Engine
**Status: Not Started**

| Task | Status | Notes |
|------|--------|-------|
| Notification service | [ ] | Email, in-app, SMS |
| Auth threshold alerts | [ ] | |
| Claim status notifications | [ ] | |
| Supervisor review reminders | [ ] | |
| Shift notifications | [ ] | |
| Onboarding status updates | [ ] | |
| Break-glass notifications | [ ] | |

---

## Phase 10: Guardian Portal API
**Status: Not Started**

| Task | Status | Notes |
|------|--------|-------|
| ISP summaries endpoint | [ ] | Read-only |
| Progress reports endpoint | [ ] | Read-only |
| Incident summaries endpoint | [ ] | Redacted |
| Scheduled services endpoint | [ ] | Read-only |
| Guardian authentication | [ ] | Limited-scope JWT |

---

## Phase 11: Reporting & Analytics
**Status: Not Started**

| Task | Status | Notes |
|------|--------|-------|
| Billing reconciliation reports | [ ] | |
| AR aging reports | [ ] | |
| Claims lifecycle analytics | [ ] | |
| Documentation compliance reports | [ ] | |
| EVV compliance reports | [ ] | |
| Staff utilization reports | [ ] | |
| Authorization usage reports | [ ] | |
| Platform analytics (SuperAdmin) | [ ] | |
| Export (CSV, PDF) | [ ] | |

---

## Phase 12: Hardening & Compliance
**Status: Not Started**

| Task | Status | Notes |
|------|--------|-------|
| OWASP security audit | [ ] | |
| HIPAA compliance review | [ ] | |
| Penetration testing prep | [ ] | |
| Performance / load testing | [ ] | |
| DB query optimization | [ ] | |
| Rate limiting tuning | [ ] | |
| Error handling audit | [ ] | No PHI leakage |
| Audit log completeness | [ ] | |
| Encryption verification | [ ] | |
| Disaster recovery testing | [ ] | |

---

## Summary

| Phase | Progress | Key Blocker |
|-------|----------|-------------|
| 0 - Foundation | 19/20 | CI/CD pipeline remaining |
| 1 - Auth & Multi-Tenancy | 0/11 | Phase 0 completion |
| 2 - Core Entities | 0/9 | Phase 1 completion |
| 3 - Service Documentation | 0/10 | Phase 2 completion |
| 4 - EVV | 0/7 | Phase 2 completion |
| 5 - Scheduling | 0/6 | Phase 4 completion |
| 6 - Billing & Claims | 0/16 | Phase 3 completion |
| 7 - Payment Reconciliation | 0/8 | Phase 6 completion |
| 8 - SuperAdmin Console | 0/14 | Phase 1 completion |
| 9 - Notifications | 0/7 | Phases 3-8 |
| 10 - Guardian Portal | 0/5 | Phase 3 completion |
| 11 - Reporting | 0/9 | Phases 6-8 |
| 12 - Hardening | 0/10 | All phases |
| **Total** | **19/122** | |
