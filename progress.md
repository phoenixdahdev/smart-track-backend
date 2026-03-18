# SmartTrack Health - Progress Tracker

> Last updated: 2026-03-18

## Legend

- [ ] Not started
- [~] In progress
- [x] Complete
- [!] Blocked (see notes)

---

## Phase 0: Project Foundation

**Status: Complete (19/20 — CI/CD deferred)**

| Task                                            | Status | Notes                                                                                       |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| Initialize NestJS project                       | [x]    | NestJS 11, pnpm, TypeScript                                                                 |
| ESLint + Prettier config                        | [x]    | Flat config, single quotes, trailing commas                                                 |
| TypeScript config                               | [x]    | Path aliases, strictNullChecks, decorators                                                  |
| PostgreSQL connection (TypeORM)                 | [x]    | DatabaseModule, data-source.ts, AbstractModelAction + DAL pattern                           |
| Environment config module                       | [x]    | @nestjs/config (global) + .env.example                                                      |
| Database migrations infrastructure              | [x]    | TypeORM CLI scripts (generate, run, revert)                                                 |
| Flat architecture setup                         | [x]    | controllers/, services/, dals/, entities/, decorators/, guards/, interceptors/, exceptions/ |
| Response interceptor                            | [x]    | Standard envelope, camelToSnake, PHI field stripping                                        |
| Exception filter                                | [x]    | AllExceptionsFilter — PHI-safe error responses                                              |
| Guards (JWT + Roles)                            | [x]    | JwtAuthGuard, RolesGuard with @Public/@Roles decorators                                     |
| Decorators                                      | [x]    | @CurrentUser, @Roles, @Public, @PrivateFields, @SkipResponseInterceptor                     |
| Enums + state machines                          | [x]    | PlatformRole, AgencyRole, ServiceRecordStatus, ClaimStatus + transitions                    |
| Base entities                                   | [x]    | BaseEntity (UUID+timestamps), TenantBaseEntity (adds org_id)                                |
| Utils                                           | [x]    | camelToSnake, pagination, responseFormatter, validateTransition                             |
| Security middleware (CORS, helmet, compression) | [x]    | main.ts bootstrap                                                                           |
| Swagger/OpenAPI                                 | [x]    | /api/docs                                                                                   |
| ValidationPipe                                  | [x]    | Global with whitelist + transform                                                           |
| Test infrastructure + specs                     | [x]    | 84 tests, 11 suites — guards, interceptors, filters, decorators, utils, enums               |
| CI/CD pipeline                                  | [ ]    | Deferred                                                                                    |
| Project documentation                           | [x]    | CLAUDE.md, plan.md, agent.md, progress.md                                                   |
| Complete entity layer                           | [x]    | 47 entities, 22 enums, 47 DALs — all phases                                                 |

**Decisions Made:**

- ORM: TypeORM (flat DAL pattern, not NestJS modules)
- Auth: Local JWT (HS256) + Google OAuth ID token (replaced Auth0 JWKS)
- Architecture: Flat (single AppModule, registries in base.service.ts + base.controller.ts)

---

## Phase 1: Authentication & Multi-Tenancy

**Status: Complete (11/11)**

| Task                         | Status | Notes                                                                |
| ---------------------------- | ------ | -------------------------------------------------------------------- |
| Auth module (JWT + refresh)  | [x]    | Local HS256 JWT, bcrypt passwords, Google OAuth ID token signin      |
| Signup / Signin routes       | [x]    | POST signup, POST signin, POST signin/google, POST refresh           |
| MFA support (TOTP + FIDO2)   | [x]    | mfa_enabled/mfa_type on UserEntity for display, enforcement deferred |
| Organizations table          | [x]    | Entity + DAL created                                                 |
| RLS policies                 | [x]    | Migration for 29 tenant tables, append-only audit_logs               |
| Tenant context middleware    | [x]    | TenantContextInterceptor — SET LOCAL app.current_org_id per request  |
| RBAC guard decorators        | [x]    | @Roles(), @Permissions() + PermissionsGuard                          |
| Sub-permissions model        | [x]    | SubPermissionsService + PermissionsGuard (APP_GUARD)                 |
| Session management           | [x]    | AuthService.getSession(), session_timeout on AuthenticatedUser       |
| Audit log module             | [x]    | AuditLogService — agency + platform, PHI stripped, never throws      |
| Encryption service (AES-256) | [x]    | AES-256-GCM, random IV, iv:authTag:ciphertext format                 |

---

## Phase 2: Core Entity Layer

**Status: Complete (9/9)**

| Task                          | Status | Notes                                                                                        |
| ----------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Users module                  | [x]    | UserService + UserController, full CRUD, role assignment, sub-permissions, deactivate        |
| Organizations module          | [x]    | OrganizationService + OrganizationController — create/get/update (Phase 1 carry-over)        |
| Programs module               | [x]    | ProgramService + ProgramController, org-scoped CRUD                                          |
| Sites module                  | [x]    | SiteService + SiteController, program-scoped + org list                                      |
| Individuals module            | [x]    | IndividualService + IndividualController, PHI fields encrypted (SSN, DOB, medicaid_id, etc.) |
| Staff assignments module      | [x]    | StaffAssignmentService + StaffAssignmentController, by-individual / by-staff listing         |
| Console-scoped API routing    | [x]    | `/api/v1/admin/{resource}` — @Roles enforced at controller level                             |
| Permission matrix enforcement | [x]    | @Roles(AGENCY_OWNER, ADMIN) on admin routes; SUPERVISOR/CLINICIAN read access on individuals |
| Seed data / dev fixtures      | [x]    | src/database/seeds/dev.seed.ts — org, users (owner/supervisor/DSP), program, site, individual |

---

## Phase 3: Service Documentation

**Status: Complete (10/10)**

| Task                        | Status | Notes                                                                                     |
| --------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| Service records module      | [x]    | ServiceRecordService + 3 controllers (staff/supervisor/admin), state machine, staff ownership |
| Daily notes module          | [x]    | DailyNoteService + StaffDailyNoteController, nested under service records, PHI encrypted  |
| ISP goals module            | [x]    | IspGoalService + ClinicalIspGoalController, PHI encrypted (description)                   |
| ISP data points module      | [x]    | IspDataPointService + StaffIspDataPointController, goal validation                        |
| Incident reporting module   | [x]    | IncidentService + 3 controllers (staff/supervisor/admin), INCIDENT_TRANSITIONS state machine |
| BTP module (Clinician)      | [x]    | BehaviorPlanService + ClinicalBehaviorPlanController, versioning, PHI encrypted           |
| MAR module                  | [x]    | MarEntryService + StaffMarEntryController, MarResult enum, PHI encrypted (drug_name/dose/route) |
| Supervisor review queue     | [x]    | GET /supervisor/service-records/review-queue + approve/reject actions                     |
| Immutability enforcement    | [x]    | BadRequestException on update/modify of APPROVED records, validateTransition() enforced   |
| Correction request workflow | [x]    | CorrectionRequestService + 2 controllers (staff/supervisor), CORRECTION_TRANSITIONS       |

---

## Phase 4: EVV (Electronic Visit Verification)

**Status: Complete (7/7)**

| Task                           | Status | Notes                                                                                     |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------- |
| Clock-in / clock-out endpoints | [x]    | EvvPunchService + 3 controllers (staff/supervisor/admin), server-side timestamp            |
| GPS capture + validation       | [x]    | haversine utility, isWithinRadius vs site coords, non-blocking (location_confirmed flag)   |
| Shift association              | [x]    | Optional shift_id on punch, inherited from clock-in on clock-out                          |
| Missed punch detection         | [x]    | findMissedPunches (threshold-based), supervisor flag-missed → auto-creates correction     |
| Double clock-in prevention     | [x]    | findOpenSession check — BadRequestException if staff+individual already has open session   |
| Correction workflow            | [x]    | EvvCorrectionService, approve creates new EvvPunch, CORRECTION_TRANSITIONS state machine  |
| EVV → service record linkage   | [x]    | linkToServiceRecord validates staff+individual match, updates evv_punch_in/out_id columns |

---

## Phase 5: Scheduling

**Status: Complete (6/6)**

| Task                    | Status | Notes                                                                                     |
| ----------------------- | ------ | ----------------------------------------------------------------------------------------- |
| Schedule creation       | [x]    | ShiftService.create, DRAFT default, staff assignment + conflict validation                |
| Shift assignment        | [x]    | SHIFT_TRANSITIONS state machine, publish/cancel/accept/reject methods                     |
| Staff schedule view     | [x]    | StaffShiftController — list my shifts, get by ID, date/status filters                     |
| Accept/reject workflow  | [x]    | PUBLISHED → ACCEPTED/REJECTED, staff ownership enforced, responded_at set                 |
| Conflict detection      | [x]    | Same staff + date + overlapping time, excludes terminal states, standalone query endpoint  |
| Schedule-to-EVV linkage | [x]    | Phase 4 already stores shift_id on EvvPunch; no additional work needed                    |

---

## Phase 6: Billing & Claims Engine

**Status: Complete (16/16)**

| Task                                      | Status | Notes                                                                                     |
| ----------------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| Payer configuration module                | [x]    | PayerConfigService + AdminPayerConfigController, CRUD + deactivate, copies from global    |
| Service codes module                      | [x]    | ServiceCodeService + AdminServiceCodeController, CRUD + deactivate, copies from global    |
| Rate tables module                        | [x]    | RateTableService + AdminRateTableController, CRUD + date-range lookup                     |
| Service authorization management          | [x]    | ServiceAuthorizationService + billing/admin controllers, CRUD + void + unit tracking      |
| Authorization threshold alerts            | [x]    | checkThresholds (80%, 95%, exceeded, expiring within 30 days)                             |
| Individual payer coverage                 | [x]    | IndividualPayerCoverageService + admin/billing controllers, priority-ordered coverage      |
| Billing queue (approved unbilled records) | [x]    | BillingQueueService + BillingQueueController, enriched queue items with coverage/auth info |
| Claim generation (service record → claim) | [x]    | ClaimMappingService — 7-step mapping (payer, rate, auth, type, build, charge, history)    |
| Claim type determination (837P vs 837I)   | [x]    | Program.billing_type + PayerConfig.config.claim_type_override                             |
| Pre-submission validation (13 checks)     | [x]    | ClaimValidationService — 13 checks, validateAndStore persists results                     |
| Claim status lifecycle                    | [x]    | ClaimService — state machine transitions, DRAFT-only edits, replacement claims            |
| Claim line management                     | [x]    | ClaimLineService + BillingClaimLineController, DRAFT-only, auto line numbering            |
| Denial handling workflow                  | [x]    | DenialHandlerService — categorize (7 CARC codes), appeal/write-off/correct-and-resubmit  |
| EDI 837 generation                        | [x]    | EdiGeneratorService — clearinghouse JSON payload (V1), batch support. Raw X12 deferred V2 |
| Claim submission tracking                 | [x]    | ClaimSubmissionService + BillingClaimSubmissionController, submit/batch/response tracking  |
| 277 status response processing            | [x]    | recordResponse maps ACCEPTED→ACCEPTED_277, REJECTED→REJECTED_277, updates claim status    |

---

## Phase 7: Payment Reconciliation

**Status: Complete (8/8)**

| Task                          | Status | Notes                                                                     |
| ----------------------------- | ------ | ------------------------------------------------------------------------- |
| 835 ERA file ingestion        | [x]    | RemittanceService.ingestEra() — creates remittance + payment posts        |
| ERA parsing                   | [x]    | IngestEraDto with nested EraClaimPaymentDto/EraAdjustmentDto              |
| 4-priority matching algorithm | [x]    | CLAIM_ID → PAYER_CONTROL_NUM → SERVICE_DATE_MEMBER → MANUAL (confidence)  |
| Payment posting module        | [x]    | PaymentPostingService — applies payments, updates claim balances/status   |
| Adjustment processing         | [x]    | CAS group code mapping (CO→CONTRACTUAL, PR→PATIENT, OA→OTHER, PI→PAYER)  |
| EFT reconciliation            | [x]    | ArReportService.getEftReconciliation() — EFT total vs posted variance    |
| AR aging reports              | [x]    | 5 aging buckets (0-30, 31-60, 61-90, 91-120, 120+)                       |
| Financial dashboard endpoints | [x]    | 4 reports: AR aging, EFT reconciliation, financial dashboard, payer perf  |

---

## Phase 8: SuperAdmin Console API

**Status: Complete (14/14) — 129 suites, 1220 tests**

| Task                             | Status | Notes                                                                                  |
| -------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| Operator management              | [x]    | OperatorService + SuperadminOperatorController, 5 endpoints                            |
| Agency signup pipeline (7-stage) | [x]    | SignupApplicationService + APPLICATION_TRANSITIONS state machine, 11 endpoints          |
| Application review queue         | [x]    | Notes, documents, verify, assign reviewer                                              |
| Risk scoring                     | [x]    | RiskScoringService — NPI, EIN, free email, enterprise tier checks                      |
| Tenant provisioning automation   | [x]    | TenantProvisioningService — creates org, admin user, subscription, checklist, modules   |
| Onboarding checklists            | [x]    | OnboardingService — 10 standard tasks, specialist assignment, complete/skip             |
| Agency management                | [x]    | AgencyManagementService — status, contacts, agreements, modules, flags, 13 endpoints   |
| Global service code library      | [x]    | GlobalServiceCodeService — CRUD + deprecate, 5 endpoints                               |
| Global payer configuration       | [x]    | GlobalPayerService — CRUD + deactivate, 5 endpoints                                    |
| Subscription plan management     | [x]    | SubscriptionManagementService — plans, subscriptions, invoices, 4+5 endpoints          |
| Feature flags + module toggles   | [x]    | Upsert pattern for modules and flags                                                   |
| Platform health monitoring       | [x]    | SuperadminDashboardController — agencies, apps, subscriptions by status                |
| Break-glass access protocol      | [x]    | BreakGlassService — request, approve (no self-approve), end, 6 endpoints               |
| Platform audit log               | [x]    | SuperadminAuditLogController — filtered listing via PlatformAuditLogDal                |

---

## Phase 9: Notification Engine

**Status: Complete (7/7)**

| Task                        | Status | Notes                                                                                   |
| --------------------------- | ------ | --------------------------------------------------------------------------------------- |
| Notification service        | [x]    | NotificationService, NotificationPreferenceService, NotificationDispatchService + specs |
| Auth threshold alerts       | [x]    | 80%/95%/100% usage + 30d/7d/1d/expired expiry alerts with 24h dedup                    |
| Claim status notifications  | [x]    | Fire-and-forget hook in ClaimService.transitionStatus()                                 |
| Supervisor review reminders | [x]    | Manual trigger endpoint, checks PENDING_REVIEW > N hours                                |
| Shift notifications         | [x]    | Hooks in ShiftService.publish() and cancel()                                            |
| Onboarding status updates   | [x]    | Hooks in OnboardingService.completeTask() and completeChecklist()                       |
| Break-glass notifications   | [x]    | Hooks in BreakGlassService.request() and approve()                                     |

---

## Phase 10: Guardian Portal API

**Status: Complete (10/10)**

| Task                              | Status | Notes                                                                     |
| --------------------------------- | ------ | ------------------------------------------------------------------------- |
| GuardianIndividual entity + DAL   | [x]    | Many-to-many linking table, relationship enum, unique constraint          |
| Guardian portal types + DTOs      | [x]    | 10 redacted types, 6 query DTOs                                          |
| GuardianPortalService             | [x]    | 11 methods, PHI redaction, access validation, decrypt-on-read             |
| Portal Individual controller      | [x]    | 3 endpoints: list, profile (redacted), dashboard (aggregates)             |
| Portal data controllers (6)       | [x]    | Service records, incidents, ISP, schedule, medications, ADL — all GET     |
| Portal notification controller    | [x]    | 6 endpoints: list, unread-count, preferences, update, mark-read, mark-all|
| Guardian notification hooks       | [x]    | onIncidentReportedForGuardian, onIspGoalProgressUpdated (fire-and-forget) |
| Flat architecture registration    | [x]    | imports.ts, base.service.ts, base.controller.ts updated                   |
| Migration                         | [x]    | guardian_individuals table + GUARDIAN_UPDATE enum value                    |
| Postman collection                | [x]    | 16 endpoints under Guardian Portal folder                                 |

---

## Phase 11: Reporting & Analytics

**Status: Complete (9/9)**

| Task                             | Status | Notes |
| -------------------------------- | ------ | ----- |
| Billing reconciliation reports   | [x]    | Already done in Phase 7 (ArReportService) |
| AR aging reports                 | [x]    | Already done in Phase 7 (ArReportService) |
| Claims lifecycle analytics       | [x]    | ClaimsAnalyticsService — 2 controllers (billing + admin) |
| Documentation compliance reports | [x]    | DocumentationComplianceService — 2 controllers (supervisor + admin) |
| EVV compliance reports           | [x]    | EvvComplianceService — 2 controllers (supervisor + admin) |
| Staff utilization reports        | [x]    | StaffUtilizationService — 2 controllers (admin + supervisor) |
| Authorization usage reports      | [x]    | AuthorizationUsageService — 2 controllers (billing + admin) |
| Platform analytics (SuperAdmin)  | [x]    | PlatformAnalyticsService + SuperadminAnalyticsController |
| Export (CSV, PDF)                | [x]    | CSV via CsvExportService + arrayToCsv utility; PDF deferred |

---

## Phase 12: Hardening & Compliance

**Status: Not Started**

| Task                       | Status | Notes          |
| -------------------------- | ------ | -------------- |
| OWASP security audit       | [ ]    |                |
| HIPAA compliance review    | [ ]    |                |
| Penetration testing prep   | [ ]    |                |
| Performance / load testing | [ ]    |                |
| DB query optimization      | [ ]    |                |
| Rate limiting tuning       | [ ]    |                |
| Error handling audit       | [ ]    | No PHI leakage |
| Audit log completeness     | [ ]    |                |
| Encryption verification    | [ ]    |                |
| Disaster recovery testing  | [ ]    |                |

---

## Summary

| Phase                      | Progress   | Key Blocker                              |
| -------------------------- | ---------- | ---------------------------------------- |
| 0 - Foundation             | 20/21      | CI/CD pipeline remaining                 |
| 1 - Auth & Multi-Tenancy   | 11/11      | Complete — local JWT + Google OAuth      |
| 2 - Core Entities          | 9/9        | Complete — services, controllers, routing, PHI encryption, seed data |
| 3 - Service Documentation  | 10/10      | Complete — 3 consoles (staff/supervisor/clinical), 13 controllers, 8 services |
| 4 - EVV                    | 7/7        | Complete — 3 consoles, GPS validation, correction workflow |
| 5 - Scheduling             | 6/6        | Complete — 3 consoles, state machine, conflict detection |
| 6 - Billing & Claims       | 16/16      | Complete — 10 services, 12 controllers, 21 DTOs, 304 new tests |
| 7 - Payment Reconciliation | 8/8        | Complete — ERA ingestion, matching, posting, AR reports |
| 8 - SuperAdmin Console     | 14/14      | Complete — 10 services, 10 controllers, platform dashboard |
| 9 - Notifications          | 7/7        | Complete — 4 services, 5 controllers, 5 integration hooks |
| 10 - Guardian Portal       | 10/10      | Complete — 8 controllers, 1 service, 11 methods, PHI redaction |
| 11 - Reporting             | 9/9        | Complete — 7 services, 11 controllers, CSV export |
| 12 - Hardening             | 0/10       | All phases                               |
| **Total**                  | **118/123** |                                          |

**Phase 11 (2026-03-18):** Reporting & Analytics complete. 6 report services (ClaimsAnalytics, DocumentationCompliance, EvvCompliance, StaffUtilization, AuthorizationUsage, PlatformAnalytics) + CsvExportService. 11 controllers across 4 consoles (2 billing, 5 admin, 2 supervisor, 1 superadmin + 1 admin auth-usage). CSV export utility (arrayToCsv, centsToDollars, formatDate) with comma/quote/newline escaping. @SkipResponseInterceptor on /export endpoints. Domain-based services shared across consoles. No new entities or migrations — all in-memory aggregation from existing DALs. 24 Postman endpoints added. 134 new tests (1515 total, 167 suites).

**Phase 10 (2026-03-17):** Guardian Portal API complete. 7th and final console (`/api/v1/portal/*`). Read-only views for guardians/family members. GuardianIndividualEntity (many-to-many linking table with relationship enum). GuardianPortalService (11 methods: access validation, linked individuals, redacted profile with computed age, dashboard with aggregate counts, service records/incidents/ISP goals/schedule/medications/ADL — all with PHI redaction). 8 controllers (individual, service-record, incident, ISP, schedule, MAR, ADL, notification). 10 redacted type interfaces, 6 query DTOs. Guardian notification hooks (fire-and-forget in IncidentService.submit() and IspDataPointService.create()). GUARDIAN_UPDATE notification type. 54 new tests (1381 total, 148 suites). 16 Postman endpoints added.

**Phase 9 (2026-03-16):** Notification Engine complete. Multi-channel dispatch (in-app + email via Resend, SMS stubbed). 4 services (NotificationService, NotificationPreferenceService, NotificationDispatchService, NotificationTriggerService), 5 controllers (admin/billing/supervisor/staff/clinical), 7 DTOs, 1 types file, 9 spec files. 5 existing services modified with fire-and-forget hooks (claim, shift, service-authorization, onboarding, break-glass). Auth threshold alerts (80%/95%/100% + expiry 30d/7d/1d) with 24h dedup. Preference-respecting dispatch (channel toggles + per-type JSONB overrides). Manual trigger endpoints for auth thresholds and review reminders. 107 new tests (1327 total, 138 suites). 36 Postman endpoints added.

**Entity Layer Complete:** 49 entities (+IndividualPayerCoverage, ClaimStatusHistory), 23 enums, 49 DALs — all registered in imports.ts and base.service.ts. Build passes, 826 tests green across 90 suites.

**Phase 6 (2026-03-13):** Billing & Claims Engine complete. Largest phase — 3 sub-phases (6A: Configuration, 6B: Claims Processing, 6C: EDI & Submission). 2 new entities (IndividualPayerCoverage, ClaimStatusHistory), 3 entity modifications (Claim: validation/payment fields, Program: billing_type, Organization: taxonomy_code). 10 services, 12 controllers (admin + billing consoles), 21 DTOs, 1 types file, 25 spec files, 1 migration. 304 new tests. V1 uses clearinghouse JSON payload (raw X12 EDI deferred to V2). Denial handling covers 7 CARC codes with appeal/write-off/correct-and-resubmit workflows.

**Phase 5 (2026-03-13):** Scheduling complete. ShiftService + 3 controllers (staff/supervisor/admin), 4 DTOs, SHIFT_TRANSITIONS state machine (8 states, 10 transitions). Conflict detection (same staff + date + overlapping time, excludes terminal states). DRAFT-only editing, publish/cancel/accept/reject workflow with audit logging. 68 new tests (30 service + 38 controller). 20 Postman endpoints added.

**Phase 3 (2026-03-10):** Service Documentation complete. 8 services, 13 controllers across 3 new consoles (/staff/*, /supervisor/*, /clinical/*). 15 DTOs, 116 new tests. State machine enforcement (service records + incidents + corrections), immutability on APPROVED records, PHI encryption on 8 fields across 5 entities, audit logging on all mutations/reads. MarResult enum + INCIDENT_TRANSITIONS + CORRECTION_TRANSITIONS added.

**Auth Rewrite (2026-03-06):** Replaced Auth0 JWKS (RS256) with local JWT (HS256) + bcrypt password auth + Google OAuth ID token signin. Added `password` column to users table (nullable for OAuth-only users). Removed `jwks-rsa` dependency, added `bcrypt` + `google-auth-library`. @PrivateFields(['password', 'otp_code', 'reset_token']) strips sensitive fields from responses.

**Auth Enhancements (2026-03-06):** org_id made optional at signup (users create orgs post-signup). UserEntity changed from TenantBaseEntity to BaseEntity with nullable org_id. Added: OrganizationController/Service (create/get/update orgs, assigns AGENCY_OWNER role), EmailService (Resend SDK for OTP + password reset emails), email verification (OTP 6-digit, 10-min expiry), forgot-password/reset-password (SHA256-hashed tokens, 1-hour expiry), GET /auth/me. 11 auth routes total: signup, verify-email, resend-otp, signin, signin/google, me, session, forgot-password, reset-password, signout, refresh. All DTOs have @ApiProperty Swagger decorators. Migration: auth-enhancements (dropped auth0_sub, nullable org_id, email_verified, otp, reset_token fields).
